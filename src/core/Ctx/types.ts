import {
  CtxId,
  ValueCategoryName,
  ValueId,
  ValueName,
} from '../../common/types/Value';

interface IMachineCtx {
  setValue: (key: string, value: any, category: Record<string, any>) => void;
  getValue: (value: any, category: Record<string, any>) => any;
  subscribe: (key: string, setState: any, categoryId: string) => any;
  dynamicSetup: (ctx: any, options: any) => void;
  toRecord: () => Record<string, any>;
  toReactiveRecord: (options: { readonly: boolean }) => ReactiveCtx;
  getCtxIdByValueId: (valueId: ValueId) => CtxId;
}

type CtxApi = {
  setup: any;
  useFlag: any;
};

type CtxMatter = Record<ValueCategoryName, Record<ValueName, any>>;

type ReactiveCtx = Record<string, any>;

export { IMachineCtx, CtxApi, ReactiveCtx, CtxMatter };
