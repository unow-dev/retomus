import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ActionHandlers, ActionHandler } from '../../common/types/Action';
import { Ctx, MergedCtx } from '../Ctx';
import { RetomusCommandBus, RetomusEventBus } from '../Retomus';
import { DEFAULT_STATUS } from './constants';
import { MachineApi, MachineHooks } from './types';

class Machine {
   id: string;
   config: any;
   status: string | typeof DEFAULT_STATUS = DEFAULT_STATUS;
   statusSubscribers: Set<React.Dispatch<React.SetStateAction<any>>> =
      new Set();
   ctx: {
      single: Ctx | null;
      merged: MergedCtx | null;
   } = { single: null, merged: null };
   actionHandlers: ActionHandlers = new Map<string, ActionHandler>();
   sharedCtxIds: string[] = [];
   typeBus: {
      ctx: 'single' | 'merged';
   } = { ctx: 'single' };
   stateBus: {
      isDoneSetupStatus: boolean;
      isDoneStaticCtxSetup: boolean;
      isDoneDynamicCtxSetup: boolean;
   } = {
      isDoneSetupStatus: false,
      isDoneStaticCtxSetup: false,
      isDoneDynamicCtxSetup: false,
   };
   flagBus: {
      isReady: boolean;
      isReadyCtx: boolean;
      isReadyActions: boolean;
   } = { isReady: false, isReadyCtx: false, isReadyActions: false };
   flagSubscribers: Record<
      string,
      Set<React.Dispatch<React.SetStateAction<any>>>
   > = {};
   retomusEventBus: RetomusEventBus;
   retomusCommandBus: RetomusCommandBus;
   constructor(
      config: any,
      retomusEventBus: RetomusEventBus,
      retomusCommandBus: RetomusCommandBus,
   ) {
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

   setValue(key: string, value: any, category: 'states' | 'refs') {
      this.ctx[this.typeBus.ctx]?.setValue(key, value, category);
   }

   getValue(key: string, category: 'states' | 'refs') {
      return this.ctx[this.typeBus.ctx]?.getValue(key, category);
   }

   dynamicSetup(
      ctx: Record<'states' | 'refs', Record<string, any>>,
      actionHandlers: ActionHandlers,
      options = { ctx: { overwrite: true }, actionHandlers: {} },
   ) {
      if (this.config.options.dynamicSetupCtx) {
         this.ctx[this.typeBus?.ctx]?.dynamicSetup(ctx, options.ctx);
         this._updateIsReadyCtx(true);
      }
      this._dynamicSetupStatus(this.config.initialStatusDefinition);
      if (this.config.options.dynamicSetupActions) {
         this._dynamicSetupActionHandlers(
            actionHandlers,
            options.actionHandlers,
         );
         this._updateIsReadyActions(true);
      }
   }

   subscribeStatus(setStatus: React.Dispatch<React.SetStateAction<any>>) {
      this.statusSubscribers.add(setStatus);
      return () => {
         this.statusSubscribers.delete(setStatus);
      };
   }

   subscribeState(
      key: string,
      setState: React.Dispatch<React.SetStateAction<any>>,
   ) {
      return this.ctx[this.typeBus.ctx]?.subscribeState(key, setState);
   }

   // --- hooks ---
   createHooks(): MachineHooks {
      const useMachineStatusIn = machine => () => {
         const [status, setStatus] = useState(machine.status);
         const unsubscribe = useMemo(
            () => machine.subscribeStatus(setStatus),
            [setStatus],
         );
         useEffect(() => {
            return unsubscribe;
         }, [unsubscribe]);
         return status;
      };

      const useMachineStateIn = machine => key => {
         const [state, setState] = useState(machine.getValue(key, 'states'));
         const unsubscribe = useMemo(
            () => machine.subscribeState(key, setState),
            [setState],
         );
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
         return (payload: any) => machine._executeAction(key, payload);
      };

      const useMachineFlagIn = machine => key => {
         const [flag, setFlag] = useState(machine.flagBus[key]);
         const unsubscribe = useMemo(
            () => machine._subscribeFlag(key, setFlag),
            [setFlag],
         );
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
   _setFlag(key: string, value: boolean) {
      this.flagBus[key] = value;
      this._notifyFlagSubscribers(key);
   }

   _updateIsReady() {
      if (this.flagBus.isReady) return;
      if (this.flagBus.isReadyCtx && this.flagBus.isReadyActions) {
         this._setFlag('isReady', true);
         this._notifyFlagSubscribers('isReady');
         this.retomusEventBus.emitMachineIsReady(this);
      } else {
         if (!this.flagBus.isReadyCtx) {
            this._subscribeFlag('isReadyCtx', (value: boolean) =>
               this._updateIsReady(),
            );
         }
         if (!this.flagBus.isReadyActions) {
            this._subscribeFlag('isReadyActions', (value: boolean) =>
               this._updateIsReady(),
            );
         }
      }
   }

   _updateIsReadyCtx(value: boolean) {
      if (value === this.flagBus.isReadyCtx) return;
      this.flagBus.isReadyCtx = value;
      this._notifyFlagSubscribers('isReadyCtx');
   }

   _updateIsReadyActions(value: boolean) {
      if (value === this.flagBus.isReadyActions) return;
      if (value && this.flagBus.isReadyCtx) {
         this.flagBus.isReadyActions = true;
         this._notifyFlagSubscribers('isReadyActions');
      } else {
         this._subscribeFlag('isReadyCtx', (value: boolean) => {
            this._updateIsReadyActions(value);
         });
      }
   }

   _notifyFlagSubscribers(key: string) {
      if (this.flagSubscribers[key]) {
         for (const subscriber of this.flagSubscribers[key]) {
            subscriber(this.flagBus[key]);
         }
      }
   }

   _subscribeFlag(
      key: string,
      callback:
         | React.Dispatch<React.SetStateAction<any>>
         | ((value: boolean) => void),
   ) {
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

   _dynamicSetupActionHandlers(
      actionHandlerDefinitions: ActionHandlers,
      options,
   ) {
      const overwrite = options?.overwrite || false;
      if (overwrite) {
         this.actionHandlers = new Map(
            Object.entries(actionHandlerDefinitions),
         );
      } else {
         for (const [key, value] of Object.entries(actionHandlerDefinitions)) {
            this.actionHandlers.set(key, value);
         }
      }
   }

   async _executeAction(action: string, payload: any) {
      if (this.flagBus.isReadyActions === false) return;

      this._validateAction(action);

      const handler = this.actionHandlers.get(action);
      let returnValues;
      if (handler) {
         try {
            returnValues = await this._processActionHandler(handler, payload);
         } catch (error) {
            console.error('Error occurred during processing action:', error);
         }
      }

      return this._processTransitionSuccess(returnValues, action);
   }

   _processActionHandler(handler, payload): Promise<any> {
      return new Promise((resolve, reject) => {
         try {
            handler({
               ctx: this.ctx[this.typeBus.ctx]?.toReactiveRecord(),
               payload,
               done: returnValues => {
                  resolve(returnValues);
               },
            });
         } catch (error) {
            reject(error);
         }
      });
   }

   _validateAction(action: string) {
      const status = this.status;
      if (status === DEFAULT_STATUS) {
         console.error(
            'Status is not set. Please set the status before executing an action.',
         );
      }
      if (!this.config.actionDefinitions.includes(action)) {
         // throw new Error(`Action "${action}" is not defined.`);
         console.error(
            'Action is not defined. Please define the action before executing it.',
         );
      }
      if (!this.config.transitionDefinitions[status][action]) {
         // throw new Error(
         //    `Transition "${status}" to "${action}" is not defined.`,
         // );
         console.error(
            'Transition is not defined. Please define the transition before executing it.',
         );
      }
   }

   // transition
   _processTransitionError(error: any, action: string) {
      const onInvalidAction = this.config.onInvalidAction;
      if (onInvalidAction) {
         onInvalidAction(action, this.status);
      }
      console.error('Error occurred during processing action:', error);
   }

   _processTransitionSuccess(returnValues: any, action: string) {
      const nextStatus = this.config.transitionDefinitions[this.status][action];
      this._transitionStatus(nextStatus);
      return returnValues;
   }

   // status
   _staticSetupStatus(initialStatusDefinition) {
      const { status, options } = initialStatusDefinition;
      if (typeof status === 'string') {
         this.status = status;
      } else if (options.staticSetup) {
         this.status = status(this.ctx.single?.toRecord());
      }
   }

   _dynamicSetupStatus(initialStatusDefinition) {
      const { status, options } = initialStatusDefinition;
      if (typeof status === 'function' && options.dynamicSetup) {
         this.status = status(this.ctx[this.typeBus.ctx]?.toRecord());

         this._notifyStatusSubscribers();
      }
   }

   _notifyStatusSubscribers() {
      this.statusSubscribers.forEach(setStatus => {
         setStatus(this.status);
      });
   }

   _transitionStatus(status: string) {
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

   _setupMergedCtx(sharedCtxs: Record<string, Ctx>) {
      const mergedCtx = new MergedCtx((this.ctx.single as Ctx), {
         ...sharedCtxs,
      });
      this.ctx.merged = mergedCtx;
      this.typeBus.ctx = 'merged';
   }
}

export default Machine;
