
interface IMachineCtx {
   setValue: (key: string, value: any, category: 'states' | 'refs') => void;
   getValue: (value: any, category: 'states' | 'refs') => any;
   dynamicSetup: (ctx: any, options: any) => void;
   toRecord: () => Record<string, any>;
   toReactiveRecord: () => ReactiveCtx;
}

type CtxApi = {
   setup: any;
   useState: any;
   useRef: any;
   useFlag: any;
};

type ReactiveCtx = Record<string, any>;

export { IMachineCtx, CtxApi, ReactiveCtx };