import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import { ActionHandlers, ActionHandler } from '../../common/types/Action';
import { Ctx, MergedCtx } from '../Ctx';
import { RetomusCommandBus, RetomusEventBus } from '../Retomus';
import { DEFAULT_STATUS } from './constants';
import { MachineApi, MachineHooks } from './types';
import { createMachineValueHooks } from './hooks';
import {
  ValueCategories,
  ValueCategory,
  ValueCategoryName,
  ValueId,
} from '../../common/types/Value';
import {
  compileValueCategoriesRecordToMap,
  compileValuesRecordToMap,
} from '../../common/utils';
import { CtxMatter } from '../Ctx/types';

const createMachine = (
  config: any,
  eventBus: RetomusEventBus,
  commandBus: RetomusCommandBus,
  valueCategories: Record<ValueCategoryName, ValueCategory>,
) => {
  return new Machine(
    config,
    eventBus,
    commandBus,
    compileValueCategoriesRecordToMap(valueCategories),
  );
};

class Machine {
  id: string;
  config: any;
  status: string | typeof DEFAULT_STATUS = DEFAULT_STATUS;
  statusSubscribers: Set<React.Dispatch<React.SetStateAction<any>>> = new Set();
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
  valueCategories: ValueCategories;
  constructor(
    config: any,
    retomusEventBus: RetomusEventBus,
    retomusCommandBus: RetomusCommandBus,
    valueCategories: ValueCategories,
  ) {
    this.id = config.id;
    this.config = config;
    this.retomusEventBus = retomusEventBus;
    this.retomusCommandBus = retomusCommandBus;
    this.valueCategories = valueCategories;
    this._staticSetupCtx(config.ctx);
    this._staticSetupStatus(config.initialStatus);
    this._staticSetupActionHandlers(config.actionHandlers);
    const options = config?.options;
    if (options) {
      this._updateIsReadyCtx(!options?.dynamicSetupCtx);
      this._updateIsReadyActions(!options?.dynamicSetupActions);
      this._updateIsReady();
      if (options?.sharedCtxIds) {
        this.sharedCtxIds = options.sharedCtxIds;
        const ctxs = this.sharedCtxIds.reduce((acc, ctxId) => {
          acc[ctxId] = this.retomusCommandBus.execute('getCtx', ctxId);

          return acc;
        }, {});
        this._setupMergedCtx(ctxs);
      }
    } else {
      this._updateIsReadyCtx(true);
      this._updateIsReadyActions(true);
      this._updateIsReady();
    }
  }

  getCtxIdByValueId(valueId: ValueId) {
    return this.ctx[this.typeBus.ctx]?.getCtxIdByValueId(valueId);
  }

  setValue(key: ValueId, value: any) {

    this.ctx[this.typeBus.ctx]?.setValue(key, value);
  }

  getValue(key: ValueId) {
    return this.ctx[this.typeBus.ctx]?.getValue(key);
  }

  dynamicSetup(
    ctxMatter: CtxMatter,
    actionHandlers: ActionHandlers,
    options = { ctx: { overwrite: true }, actionHandlers: {} },
  ) {
    let enableDynamicSetupCtx = true;
    let enableDynamicSetupActions = true;
    if (this.config?.options) {
      enableDynamicSetupCtx = this.config.options?.dynamicSetupCtx;
      enableDynamicSetupActions = this.config.options?.dynamicSetupActions;
    }
    if (enableDynamicSetupCtx) {
      if (ctxMatter) {
        this.ctx[this.typeBus?.ctx]?.dynamicSetup(ctxMatter, options.ctx);
      }
      this._updateIsReadyCtx(true);
    }
    this._dynamicSetupStatus(this.config.initialStatus);
    if (enableDynamicSetupActions) {
      if (actionHandlers) {
        this._dynamicSetupActionHandlers(
          actionHandlers,
          options.actionHandlers,
        );
      }
      this._updateIsReadyActions(true);
    }
  }

  subscribeStatus(setStatus: React.Dispatch<React.SetStateAction<any>>) {

    this.statusSubscribers.add(setStatus);
    return () => {
      this.statusSubscribers.delete(setStatus);
    };
  }

  subscribe(key: ValueId, setState: React.Dispatch<React.SetStateAction<any>>) {
    return this.ctx[this.typeBus.ctx]?.subscribe(key, setState);
  }

  // --- hooks ---
  createHooks(): MachineHooks {
    const useMachineStatusIn = machine => () => {
      const [status, setStatus] = useState(machine.status);
      const subscribeStatus = useCallback(
        () => machine.subscribeStatus(setStatus),
        [setStatus],
      );
      useEffect(() => {
        const unsubscribe = subscribeStatus();
        return unsubscribe;
      }, [subscribeStatus]);
      return status;
    };

    const useMachineActionIn = machine => key => {
      return (payload: any) => machine._executeAction(key, payload);
    };

    const useMachineFlagIn = machine => key => {
      const [flag, setFlag] = useState(machine.flagBus[key]);
      const subscribeFlag = useCallback(
        () => machine._subscribeFlag(key, setFlag),
        [setFlag],
      );
      useEffect(() => {
        const unsubscribe = subscribeFlag();
        return unsubscribe;
      }, [subscribeFlag]);
      return flag;
    };

    return {
      useStatus: useMachineStatusIn(this),
      useAction: useMachineActionIn(this),
      ...createMachineValueHooks(this, this.valueCategories),
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
  _staticSetupActionHandlers(actionHandlers: ActionHandlers) {
    this.actionHandlers = new Map(Object.entries(actionHandlers));
  }

  _dynamicSetupActionHandlers(actionHandlers: ActionHandlers, options) {
    const overwrite = options?.overwrite || false;
    if (overwrite) {
      this.actionHandlers = new Map(Object.entries(actionHandlers));
    } else {
      for (const [key, value] of Object.entries(actionHandlers)) {
        this.actionHandlers.set(key, value);
      }
    }
  }

  async _executeAction(action: string, payload: any) {
    console.log(
      'executeAction in machine',
      action,
      payload,
      this.flagBus.isReadyActions,
      this._validateAction(action),
    );
    if (this.flagBus.isReadyActions === false) return;
    if (this._validateAction(action) === false) return;

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
          done: (returnValues: Record<string, any> = {}) => {
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
      console.log(
        'Status is not set. Please set the status before executing an action.',
      );
      return false;
    }
    if (!this.config.actions.includes(action)) {
      // throw new Error(`Action "${action}" is not defined.`);
      console.log(
        'Action is not defined. Please define the action before executing it.',
      );
      return false;
    }
    if (!this.config.transitions[status][action]) {
      // throw new Error(
      //    `Transition "${status}" to "${action}" is not defined.`,
      // );
      console.log(
        'Transition is not defined. Please define the transition before executing it.',
      );
      return false;
    }
    return true;
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
    const nextStatus = this.config.transitions[this.status][action];

    if (typeof nextStatus === 'string') {
      this._transitionStatus(nextStatus);
    } else {
      const router = this.config.router;

      try {
        const routedStatus = router[action](
          this.ctx[this.typeBus.ctx].toReactiveRecord({ readonly: true }),
        );
        this._transitionStatus(routedStatus);
      } catch (error) {

      }
    }
    return returnValues;
  }

  // status
  _staticSetupStatus(initialStatus) {
    const { status, options } = initialStatus;
    if (typeof status === 'string') {
      this.status = status;
    } else if (options.staticSetup) {
      this.status = status(
        this.ctx.single?.toReactiveRecord({ readonly: true }),
      );
    }
  }

  _dynamicSetupStatus(initialStatus) {
    const { status, options } = initialStatus;
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
    this._notifyStatusSubscribers();
  }

  // ctx
  _staticSetupCtx(ctx) {
    const ctxMatter: CtxMatter = ctx;
    this._setupSingleCtx(ctxMatter);
  }

  _setupSingleCtx(ctxMatter: CtxMatter) {
    const singleCtx = new Ctx(
      this.id,
      compileValuesRecordToMap(ctxMatter, this.id),
      this.valueCategories,
    );
    this.ctx.single = singleCtx;
    this.typeBus.ctx = 'single';
  }

  _setupMergedCtx(sharedCtxs: Record<string, Ctx>) {
    const mergedCtx = new MergedCtx(
      this.ctx.single as Ctx,
      {
        ...sharedCtxs,
      },
      this.valueCategories,
    );
    this.ctx.merged = mergedCtx;
    this.typeBus.ctx = 'merged';
  }
}

export default Machine;
export { createMachine };
