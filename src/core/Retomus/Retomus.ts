import {
  ValueCategory,
  ValueCategories,
  ValueCategoryName,
  CtxId,
} from '../../common/types/Value';
import { compileValuesRecordToMap } from '../../common/utils';
import { createCompositeActionApi } from '../CompositeAction';
import CompositeAction from '../CompositeAction/CompositeAction';
import { CompositeActionConfig } from '../CompositeAction/types';
import { createCtxApi, Ctx, SharedCtx } from '../Ctx';
import { CtxApi, CtxMatter } from '../Ctx/types';
import { createMachineApi } from '../Machine';
import Machine from '../Machine/Machine';
import { MachineApi } from '../Machine/types';
import RetomusCommandBus from './RetomusCommandBus';
import RetomusEventBus from './RetomusEventBus';
import { useState, useRef } from 'react';

const defaultValueCategories = new Map<ValueCategoryName, ValueCategory>([
  [
    'state',
    {
      id: 'state',
      use: (initialValue: any) => {
        const [state, setState] = useState(initialValue);
        return [state, setState];
      },
      setterType: 'state',
      valuePropName: null,
    },
  ],
  [
    'ref',
    {
      id: 'ref',
      use: (initialValue: any) => {
        const ref = useRef(initialValue);
        return [
          ref,
          value => {
            ref.current = value;
          },
        ];
      },
      setterType: 'ref',
      valuePropName: 'current',
    },
  ],
]);

type RetomusConfig =
  | {
      valueCategories: ValueCategories;
    }
  | undefined;

const defaultRetomusConfig: RetomusConfig = {
  valueCategories: defaultValueCategories,
};

const createRetomus = (config: RetomusConfig = defaultRetomusConfig) =>
  new Retomus(config);

const createValueCategories = (valueCategories: ValueCategory[]) => {
  return new Map(
    valueCategories.map(valueCategory => [valueCategory.id, valueCategory]),
  );
};

const createRetomusConfig = (
  param: { valueCategories: ValueCategory[] } = { valueCategories: [] },
) => {
  return {
    valueCategories: createValueCategories(param.valueCategories),
  };
};

class Retomus {
  machines: Map<string, any> = new Map<string, any>();
  ctxs: Map<string, any> = new Map<string, any>();
  stateBus: any;
  eventBus: RetomusEventBus;
  commandBus: RetomusCommandBus;
  valueCategories: Map<string, ValueCategory> = defaultValueCategories;

  constructor(config: RetomusConfig) {
    this.eventBus = new RetomusEventBus();
    this.commandBus = new RetomusCommandBus(this);
    if (config) {
      if (config.valueCategories) {
        config.valueCategories.forEach(valueCategory => {
          this.registerValueCategory(valueCategory);
        });
      }
    }
  }

  getValueCategories() {
    return this.valueCategories;
  }

  registerValueCategory(ctxValueCategory: ValueCategory) {
    this.valueCategories.set(ctxValueCategory.id, ctxValueCategory);

  }

  createMachine(config): MachineApi {
    const machine = new Machine(
      config,
      this.eventBus,
      this.commandBus,
      this.valueCategories,
    );
    this.registerMachine(config.id, machine);
    return createMachineApi(machine);
  }

  createCtx(id: CtxId, values: CtxMatter, options = {}): CtxApi {
    const valuesMap = compileValuesRecordToMap(values, id);
    const ctx = new SharedCtx(id, valuesMap, this.valueCategories);
    this.registerCtx(id, ctx);
    return createCtxApi(ctx);
  }

  createCompositeAction(config: CompositeActionConfig) {
    const compositeAction = new CompositeAction(config, this.eventBus);
    return createCompositeActionApi(compositeAction);
  }

  registerMachine(id: string, machine: any) {
    this.machines.set(id, machine);
  }

  registerCtx(id: string, ctx: any) {
    this.ctxs.set(id, ctx);
  }

  getMachine(id: string) {
    return this.machines.get(id);
  }

  getCtx(id: string): Ctx {
    return this.ctxs.get(id);
  }

  deleteMachine(id: string) {
    this.machines.delete(id);
  }

  deleteCtx(id: string) {
    this.ctxs.delete(id);
  }
}

export default Retomus;
export { createRetomus, createRetomusConfig };
