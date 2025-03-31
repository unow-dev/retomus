import { useState, useMemo, useEffect, useRef } from 'react';
import { Ctx, MergedCtx } from '../Ctx';
import { DEFAULT_STATUS } from './constants';
class Machine {
    constructor(config, retomusEventBus, retomusCommandBus) {
        this.status = DEFAULT_STATUS;
        this.statusSubscribers = new Set();
        this.ctx = { single: null, merged: null };
        this.actionHandlers = new Map();
        this.sharedCtxIds = [];
        this.typeBus = { ctx: 'single' };
        this.stateBus = {
            isDoneSetupStatus: false,
            isDoneStaticCtxSetup: false,
            isDoneDynamicCtxSetup: false,
        };
        this.flagBus = { isReady: false, isReadyCtx: false, isReadyActions: false };
        this.flagSubscribers = {};
        this.id = config.id;
        this.config = config;
        this.retomusEventBus = retomusEventBus;
        this.retomusCommandBus = retomusCommandBus;
        this._staticSetupCtx(config.ctxDefinition);
        this._staticSetupStatus(config.initialStatusDefinition);
        this._staticSetupActionHandlers(config.actionHandlerDefinitions);
        const options = config.options;
        this._updateIsReadyCtx(!options.dynamicSetupCtx);
        this._updateIsReadyActions(!options.dynamicSetupActions);
        this._updateIsReady();
        if (options.sharedCtxIds) {
            this.sharedCtxIds = options.sharedCtxIds;
            const ctxs = this.sharedCtxIds.reduce((acc, ctxId) => {
                acc[ctxId] = this.retomusCommandBus.execute('getCtx', ctxId);
                return acc;
            }, {});
            this._setupMergedCtx(ctxs);
        }
    }
    setValue(key, value, category) {
        var _a;
        (_a = this.ctx[this.typeBus.ctx]) === null || _a === void 0 ? void 0 : _a.setValue(key, value, category);
    }
    getValue(key, category) {
        var _a;
        return (_a = this.ctx[this.typeBus.ctx]) === null || _a === void 0 ? void 0 : _a.getValue(key, category);
    }
    dynamicSetup(ctx, actionHandlers, options = { ctx: { overwrite: true }, actionHandlers: {} }) {
        var _a, _b;
        if (this.config.options.dynamicSetupCtx) {
            (_b = this.ctx[(_a = this.typeBus) === null || _a === void 0 ? void 0 : _a.ctx]) === null || _b === void 0 ? void 0 : _b.dynamicSetup(ctx, options.ctx);
            this._updateIsReadyCtx(true);
        }
        this._dynamicSetupStatus(this.config.initialStatusDefinition);
        if (this.config.options.dynamicSetupActions) {
            this._dynamicSetupActionHandlers(actionHandlers, options.actionHandlers);
            this._updateIsReadyActions(true);
        }
    }
    subscribeStatus(setStatus) {
        this.statusSubscribers.add(setStatus);
        return () => {
            this.statusSubscribers.delete(setStatus);
        };
    }
    subscribeState(key, setState) {
        var _a;
        return (_a = this.ctx[this.typeBus.ctx]) === null || _a === void 0 ? void 0 : _a.subscribeState(key, setState);
    }
    // --- hooks ---
    createHooks() {
        const useMachineStatusIn = machine => () => {
            const [status, setStatus] = useState(machine.status);
            const unsubscribe = useMemo(() => machine.subscribeStatus(setStatus), [setStatus]);
            useEffect(() => {
                return unsubscribe;
            }, [unsubscribe]);
            return status;
        };
        const useMachineStateIn = machine => key => {
            const [state, setState] = useState(machine.getValue(key, 'states'));
            const unsubscribe = useMemo(() => machine.subscribeState(key, setState), [setState]);
            useEffect(() => {
                return unsubscribe;
            }, [unsubscribe]);
            return state;
        };
        const useMachineRefIn = machine => key => {
            const ref = useRef(machine.getValue(key, 'refs'));
            return ref;
        };
        const useMachineActionIn = machine => key => {
            return (payload) => machine._executeAction(key, payload);
        };
        const useMachineFlagIn = machine => key => {
            const [flag, setFlag] = useState(machine.flagBus[key]);
            const unsubscribe = useMemo(() => machine._subscribeFlag(key, setFlag), [setFlag]);
            useEffect(() => {
                return unsubscribe;
            }, [unsubscribe]);
            return flag;
        };
        return {
            useStatus: useMachineStatusIn(this),
            useAction: useMachineActionIn(this),
            useState: useMachineStateIn(this),
            useRef: useMachineRefIn(this),
            useFlag: useMachineFlagIn(this),
        };
    }
    // --- private ---
    // flag
    _setFlag(key, value) {
        this.flagBus[key] = value;
        this._notifyFlagSubscribers(key);
    }
    _updateIsReady() {
        if (this.flagBus.isReady)
            return;
        if (this.flagBus.isReadyCtx && this.flagBus.isReadyActions) {
            this._setFlag('isReady', true);
            this._notifyFlagSubscribers('isReady');
            this.retomusEventBus.emitMachineIsReady(this);
        }
        else {
            if (!this.flagBus.isReadyCtx) {
                this._subscribeFlag('isReadyCtx', (value) => this._updateIsReady());
            }
            if (!this.flagBus.isReadyActions) {
                this._subscribeFlag('isReadyActions', (value) => this._updateIsReady());
            }
        }
    }
    _updateIsReadyCtx(value) {
        if (value === this.flagBus.isReadyCtx)
            return;
        this.flagBus.isReadyCtx = value;
        this._notifyFlagSubscribers('isReadyCtx');
    }
    _updateIsReadyActions(value) {
        if (value === this.flagBus.isReadyActions)
            return;
        if (value && this.flagBus.isReadyCtx) {
            this.flagBus.isReadyActions = true;
            this._notifyFlagSubscribers('isReadyActions');
        }
        else {
            this._subscribeFlag('isReadyCtx', (value) => {
                this._updateIsReadyActions(value);
            });
        }
    }
    _notifyFlagSubscribers(key) {
        if (this.flagSubscribers[key]) {
            for (const subscriber of this.flagSubscribers[key]) {
                subscriber(this.flagBus[key]);
            }
        }
    }
    _subscribeFlag(key, callback) {
        if (!this.flagSubscribers[key]) {
            this.flagSubscribers[key] = new Set();
        }
        this.flagSubscribers[key].add(callback);
        return () => {
            this.flagSubscribers[key].delete(callback);
        };
    }
    // action
    _staticSetupActionHandlers(actionHandlerDefinitions) {
        this.actionHandlers = new Map(Object.entries(actionHandlerDefinitions));
    }
    _dynamicSetupActionHandlers(actionHandlerDefinitions, options) {
        const overwrite = (options === null || options === void 0 ? void 0 : options.overwrite) || false;
        if (overwrite) {
            this.actionHandlers = new Map(Object.entries(actionHandlerDefinitions));
        }
        else {
            for (const [key, value] of Object.entries(actionHandlerDefinitions)) {
                this.actionHandlers.set(key, value);
            }
        }
    }
    async _executeAction(action, payload) {
        if (this.flagBus.isReadyActions === false)
            return;
        this._validateAction(action);
        const handler = this.actionHandlers.get(action);
        let returnValues;
        if (handler) {
            try {
                returnValues = await this._processActionHandler(handler, payload);
            }
            catch (error) {
                console.error('Error occurred during processing action:', error);
            }
        }
        return this._processTransitionSuccess(returnValues, action);
    }
    _processActionHandler(handler, payload) {
        return new Promise((resolve, reject) => {
            var _a;
            try {
                handler({
                    ctx: (_a = this.ctx[this.typeBus.ctx]) === null || _a === void 0 ? void 0 : _a.toReactiveRecord(),
                    payload,
                    done: returnValues => {
                        resolve(returnValues);
                    },
                });
            }
            catch (error) {
                reject(error);
            }
        });
    }
    _validateAction(action) {
        const status = this.status;
        if (status === DEFAULT_STATUS) {
            console.error('Status is not set. Please set the status before executing an action.');
        }
        if (!this.config.actionDefinitions.includes(action)) {
            // throw new Error(`Action "${action}" is not defined.`);
            console.error('Action is not defined. Please define the action before executing it.');
        }
        if (!this.config.transitionDefinitions[status][action]) {
            // throw new Error(
            //    `Transition "${status}" to "${action}" is not defined.`,
            // );
            console.error('Transition is not defined. Please define the transition before executing it.');
        }
    }
    // transition
    _processTransitionError(error, action) {
        const onInvalidAction = this.config.onInvalidAction;
        if (onInvalidAction) {
            onInvalidAction(action, this.status);
        }
        console.error('Error occurred during processing action:', error);
    }
    _processTransitionSuccess(returnValues, action) {
        const nextStatus = this.config.transitionDefinitions[this.status][action];
        this._transitionStatus(nextStatus);
        return returnValues;
    }
    // status
    _staticSetupStatus(initialStatusDefinition) {
        var _a;
        const { status, options } = initialStatusDefinition;
        if (typeof status === 'string') {
            this.status = status;
        }
        else if (options.staticSetup) {
            this.status = status((_a = this.ctx.single) === null || _a === void 0 ? void 0 : _a.toRecord());
        }
    }
    _dynamicSetupStatus(initialStatusDefinition) {
        var _a;
        const { status, options } = initialStatusDefinition;
        if (typeof status === 'function' && options.dynamicSetup) {
            this.status = status((_a = this.ctx[this.typeBus.ctx]) === null || _a === void 0 ? void 0 : _a.toRecord());
            this._notifyStatusSubscribers();
        }
    }
    _notifyStatusSubscribers() {
        this.statusSubscribers.forEach(setStatus => {
            setStatus(this.status);
        });
    }
    _transitionStatus(status) {
        this.status = status;
        this.statusSubscribers.forEach(setStatus => {
            setStatus(status);
        });
    }
    // ctx
    _staticSetupCtx(ctxDefinition) {
        this._setupSingleCtx(ctxDefinition);
    }
    _setupSingleCtx(ctxDefinition) {
        const { states, refs } = ctxDefinition;
        const singleCtx = new Ctx(this.id, states, refs);
        this.ctx.single = singleCtx;
        this.typeBus.ctx = 'single';
    }
    _setupMergedCtx(sharedCtxs) {
        const mergedCtx = new MergedCtx(this.ctx.single, {
            ...sharedCtxs,
        });
        this.ctx.merged = mergedCtx;
        this.typeBus.ctx = 'merged';
    }
}
export default Machine;
