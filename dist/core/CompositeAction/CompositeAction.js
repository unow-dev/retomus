import { useState, useEffect } from 'react';
import { CompositeActionEventBus, } from './types';
export class CompositeAction {
    constructor(config, retomusEventBus) {
        var _a;
        this.id = '';
        this.actionHandlers = new Map();
        this.actionFlow = { type: 'sequence', actions: [] };
        this.resultBus = {};
        this.subscribers = {};
        this.machineIdAndActionNames = new Map();
        this.eventBus = new CompositeActionEventBus();
        this.totalOfActions = 0;
        this.countOfReadyActions = 0;
        this.concurrency = 1;
        this.currentExecutionCount = 0;
        this._executeAction = async (actionName, payload) => {
            if (this.currentExecutionCount >= this.concurrency)
                return;
            this.currentExecutionCount++;
            const actionHandler = this.actionHandlers.get(actionName);
            if (actionHandler) {
                try {
                    await actionHandler(payload);
                }
                catch (error) {
                    console.error(error);
                }
            }
            this.currentExecutionCount--;
        };
        this._handleActionFlowMatter = async (actionFlowMatter, payload) => {
            if (actionFlowMatter.type === 'action') {
                await this._executeAction(actionFlowMatter.actionName, payload);
            }
            else if (actionFlowMatter.type === 'sequence') {
                await this._handleSequenceActionFlowMatter(actionFlowMatter, payload);
            }
            else if (actionFlowMatter.type === 'parallel') {
                await this._handleParallelActionFlowMatter(actionFlowMatter, payload);
            }
        };
        this._handleSequenceActionFlowMatter = async (_actionFlowMatter, payload) => {
            for (const actionFlowMatter of _actionFlowMatter.actions) {
                if (actionFlowMatter.type === 'action') {
                    await this._executeAction(actionFlowMatter.actionName, payload);
                }
                else {
                    await this._handleActionFlowMatter(actionFlowMatter, payload);
                }
            }
        };
        this._handleParallelActionFlowMatter = async (_actionFlowMatter, payload) => {
            const promises = _actionFlowMatter.actions.map(actionFlowMatter => {
                if (actionFlowMatter.type === 'action') {
                    return this._executeAction(actionFlowMatter.actionName, payload);
                }
                else {
                    return this._handleActionFlowMatter(actionFlowMatter, payload);
                }
            });
            await Promise.all(promises);
        };
        this.id = config.id;
        this.resultBus = {};
        this.retomusEventBus = retomusEventBus;
        this._processActionFlowMatters(config.actions);
        if ((config === null || config === void 0 ? void 0 : config.options) && ((_a = config === null || config === void 0 ? void 0 : config.options) === null || _a === void 0 ? void 0 : _a.concurrency)) {
            this.concurrency = config.options.concurrency;
        }
    }
    _processActionFlowMatters(actionFlowMatters) {
        this.actionFlow = actionFlowMatters;
        actionFlowMatters.actions.forEach(actionFlowMatter => {
            this._processActionFlowMatter(actionFlowMatter);
        });
    }
    _processActionFlowMatter(actionFlowMatter) {
        if (actionFlowMatter.type === 'action') {
            this._processSingleActionFlowMatter(actionFlowMatter);
        }
        if (actionFlowMatter.type === 'parallel') {
            this._processParallelActionFlowMatter(actionFlowMatter);
        }
        if (actionFlowMatter.type === 'sequence') {
            this._processSequenceActionFlowMatter(actionFlowMatter);
        }
    }
    _processSingleActionFlowMatter(actionFlowMatter) {
        var _a;
        if (!this.machineIdAndActionNames.has(actionFlowMatter.machineId)) {
            this.machineIdAndActionNames.set(actionFlowMatter.machineId, []);
        }
        (_a = this.machineIdAndActionNames
            .get(actionFlowMatter.machineId)) === null || _a === void 0 ? void 0 : _a.push(actionFlowMatter.actionName);
        const off = this.retomusEventBus.onMachineIsReady(({ machine }) => {
            if (machine.id === actionFlowMatter.machineId) {
                this.actionHandlers.set(actionFlowMatter.actionName, async (payload) => await machine._executeAction(actionFlowMatter.actionName, payload));
                off();
            }
        });
        this.totalOfActions++;
    }
    setHandler(actionName, handler) {
        this.actionHandlers.set(actionName, handler);
        this.countOfReadyActions++;
        if (this.countOfReadyActions === this.totalOfActions) {
            this.eventBus.emitReady(this);
        }
    }
    _processParallelActionFlowMatter(actionFlowMatter) {
        actionFlowMatter.actions.forEach(actionFlowMatter => {
            if (actionFlowMatter.type === 'action') {
                this._processSingleActionFlowMatter(actionFlowMatter);
            }
            else {
                this._processActionFlowMatter(actionFlowMatter);
            }
        });
    }
    _processSequenceActionFlowMatter(actionFlowMatter) {
        actionFlowMatter.actions.forEach(actionFlowMatter => {
            if (actionFlowMatter.type === 'action') {
                this._processSingleActionFlowMatter(actionFlowMatter);
            }
            else {
                this._processActionFlowMatter(actionFlowMatter);
            }
        });
    }
    subscribe(subscriber, scope) {
        if (!this.subscribers[scope]) {
            this.subscribers[scope] = new Set();
        }
        this.subscribers[scope].add(subscriber);
        return () => {
            this.subscribers[scope].delete(subscriber);
        };
    }
    subscribeReady(subscriber) {
        return this.subscribe(subscriber, 'ready');
    }
    notifySubscribers(scope) {
        if (!this.subscribers[scope]) {
            return;
        }
        this.subscribers[scope].forEach(subscriber => subscriber());
    }
    notifyReady() {
        this.notifySubscribers('ready');
    }
    getHooks() {
        return {
            use: useIn(this),
        };
    }
    async execute(payload) {
        await this._handleActionFlowMatter(this.actionFlow, payload);
        return this.resultBus;
    }
}
const useIn = (instance) => () => {
    const [execute, setExecute] = useState(() => payload => {
        return instance.execute({ results: instance.resultBus, payload });
    });
    const [isReady, setIsReady] = useState(false);
    useEffect(() => {
        const unsubscribe = instance.subscribeReady(() => {
            setExecute(() => payload => {
                return instance.execute({ results: instance.resultBus, payload });
            });
            setIsReady(true);
        });
        return unsubscribe;
    }, [setExecute, setIsReady]);
    return [execute, isReady];
};
export default CompositeAction;
