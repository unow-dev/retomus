import { useState, useEffect } from 'react';
import { ActionHandler } from '../../common/types/Action';
import RetomusEventBus from '../Retomus/RetomusEventBus';
import {
   ICompositeAction,
   ActionFlow,
   ResultBus,
   CompositeActionEventBus,
   CompositeActionConfig,
   ActionFlowMatter,
   SingleActionFlowMatter,
   ActionName,
   ParallelActionFlowMatter,
   SequenceActionFlowMatter,
   CompositeActionApi,
   ReturnUse,
} from './types';

export class CompositeAction implements ICompositeAction {
   id: string = '';
   actionHandlers: Map<string, ActionHandler> = new Map();
   actionFlow: ActionFlow = { type: 'sequence', actions: [] };
   resultBus: ResultBus = {};
   subscribers: Record<string, Set<() => void>> = {};
   machineIdAndActionNames: Map<string, string[]> = new Map();
   eventBus: CompositeActionEventBus = new CompositeActionEventBus();
   retomusEventBus: RetomusEventBus;
   totalOfActions: number = 0;
   countOfReadyActions: number = 0;
   concurrency: number = 1;
   currentExecutionCount: number = 0;

   constructor(
      config: CompositeActionConfig,
      retomusEventBus: RetomusEventBus,
   ) {
      this.id = config.id;
      this.resultBus = {};
      this.retomusEventBus = retomusEventBus;

      this._processActionFlowMatters(config.actions);

      if (config?.options && config?.options?.concurrency) {
         this.concurrency = config.options.concurrency;
      }
   }

   _processActionFlowMatters(actionFlowMatters: ActionFlow): void {
      this.actionFlow = actionFlowMatters;
      actionFlowMatters.actions.forEach(actionFlowMatter => {
         this._processActionFlowMatter(actionFlowMatter);
      });
   }

   _processActionFlowMatter(actionFlowMatter: ActionFlowMatter): void {
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
   _processSingleActionFlowMatter(
      actionFlowMatter: SingleActionFlowMatter,
   ): void {
      if (!this.machineIdAndActionNames.has(actionFlowMatter.machineId)) {
         this.machineIdAndActionNames.set(actionFlowMatter.machineId, []);
      }
      this.machineIdAndActionNames
         .get(actionFlowMatter.machineId)
         ?.push(actionFlowMatter.actionName);

      const off = this.retomusEventBus.onMachineIsReady(({ machine }) => {
         if (machine.id === actionFlowMatter.machineId) {
            this.actionHandlers.set(
               actionFlowMatter.actionName,
               async payload =>
                  await machine._executeAction(
                     actionFlowMatter.actionName,
                     payload,
                  ),
            );
            off();
         }
      });
      this.totalOfActions++;
   }

   setHandler(actionName: ActionName, handler: ActionHandler): void {
      this.actionHandlers.set(actionName, handler);
      this.countOfReadyActions++;
      if (this.countOfReadyActions === this.totalOfActions) {
         this.eventBus.emitReady(this);
      }
   }

   _processParallelActionFlowMatter(
      actionFlowMatter: ParallelActionFlowMatter,
   ): void {
      actionFlowMatter.actions.forEach(actionFlowMatter => {
         if (actionFlowMatter.type === 'action') {
            this._processSingleActionFlowMatter(actionFlowMatter);
         } else {
            this._processActionFlowMatter(actionFlowMatter);
         }
      });
   }

   _processSequenceActionFlowMatter(
      actionFlowMatter: SequenceActionFlowMatter,
   ): void {
      actionFlowMatter.actions.forEach(actionFlowMatter => {
         if (actionFlowMatter.type === 'action') {
            this._processSingleActionFlowMatter(actionFlowMatter);
         } else {
            this._processActionFlowMatter(actionFlowMatter);
         }
      });
   }

   subscribe(subscriber: () => void, scope: string): () => void {
      if (!this.subscribers[scope]) {
         this.subscribers[scope] = new Set();
      }
      this.subscribers[scope].add(subscriber);
      return () => {
         this.subscribers[scope].delete(subscriber);
      };
   }
   subscribeReady(subscriber: () => void): () => void {
      return this.subscribe(subscriber, 'ready');
   }
   notifySubscribers(scope: string): void {
      if (!this.subscribers[scope]) {
         return;
      }
      this.subscribers[scope].forEach(subscriber => subscriber());
   }
   notifyReady(): void {
      this.notifySubscribers('ready');
   }
   getHooks(): CompositeActionApi {
      return {
         use: useIn(this),
      };
   }
   _executeAction = async (actionName: string, payload: any) => {
      if (this.currentExecutionCount >= this.concurrency) return;
      this.currentExecutionCount++;
      const actionHandler = this.actionHandlers.get(actionName);
      if (actionHandler) {
         try {
            await actionHandler(payload);
         } catch (error) {
            console.error(error);
         }
      }

      this.currentExecutionCount--;
   };
   _handleActionFlowMatter = async (
      actionFlowMatter: ActionFlowMatter,
      payload: any,
   ) => {
      if (actionFlowMatter.type === 'action') {
         await this._executeAction(actionFlowMatter.actionName, payload);
      } else if (actionFlowMatter.type === 'sequence') {
         await this._handleSequenceActionFlowMatter(actionFlowMatter, payload);
      } else if (actionFlowMatter.type === 'parallel') {
         await this._handleParallelActionFlowMatter(actionFlowMatter, payload);
      }
   };
   _handleSequenceActionFlowMatter = async (
      _actionFlowMatter: SequenceActionFlowMatter,
      payload: any,
   ) => {
      for (const actionFlowMatter of _actionFlowMatter.actions) {
         if (actionFlowMatter.type === 'action') {
            await this._executeAction(actionFlowMatter.actionName, payload);
         } else {
            await this._handleActionFlowMatter(actionFlowMatter, payload);
         }
      }
   };
   _handleParallelActionFlowMatter = async (
      _actionFlowMatter: ParallelActionFlowMatter,
      payload: any,
   ) => {
      const promises = _actionFlowMatter.actions.map(actionFlowMatter => {
         if (actionFlowMatter.type === 'action') {
            return this._executeAction(actionFlowMatter.actionName, payload);
         } else {
            return this._handleActionFlowMatter(actionFlowMatter, payload);
         }
      });
      await Promise.all(promises);
   };
   async execute(payload: any): Promise<any> {
      await this._handleActionFlowMatter(this.actionFlow, payload);
      return this.resultBus;
   }
}

const useIn = (instance: ICompositeAction) => (): ReturnUse => {
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
