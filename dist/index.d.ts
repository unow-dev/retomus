import React from 'react';
import * as react_jsx_runtime from 'react/jsx-runtime';

declare class EventBus<Events extends Record<string, any>> {
    private listeners;
    on<K extends keyof Events>(event: K, handler: (payload: Events[K]) => void): void;
    off<K extends keyof Events>(event: K, handler: (payload: Events[K]) => void): void;
    emit<K extends keyof Events>(event: K, payload: Events[K]): void;
}

type ActionHandler = ({ ctx, payload, done, error }: {
    ctx: any;
    payload: any;
    done: any;
    error: any;
}) => Promise<any> | void;

type CompositeActionConfig = {
    id: string;
    action: ActionFlow;
    options?: {
        concurrency?: number;
    };
};
type ActionName = string;
type SingleActionFlowMatter = {
    type: 'action';
    machineId: string;
    actionName: ActionName;
};
type GroupActionFlowMatter = ParallelActionFlowMatter | SequenceActionFlowMatter;
type ParallelActionFlowMatter = {
    type: 'parallel';
    actions: (SingleActionFlowMatter | GroupActionFlowMatter)[];
};
type SequenceActionFlowMatter = {
    type: 'sequence';
    actions: (SingleActionFlowMatter | GroupActionFlowMatter)[];
};
type ActionFlow = GroupActionFlowMatter;

type ValueName = string;
type CategoryId = string;
type CtxId = string;
type ValueCategoryName = string;
type ValueId = `${CategoryId}-${ValueName}`;
type Value = any;
type ReactRefValueSetter = (value: any) => void;
interface ValueCategory {
    id: ValueCategoryName;
    use: (initialValue: any) => [any, (value: any) => void];
    setterType: 'state' | 'ref';
    valuePropName?: string;
}
type ValueCategories = Map<ValueCategoryName, ValueCategory>;

interface IMachineCtx {
    setValue: (key: string, value: any, category: Record<string, any>) => void;
    getValue: (value: any, category: Record<string, any>) => any;
    subscribe: (key: string, setState: any, categoryId: string) => any;
    dynamicSetup: (ctx: any, options: any) => void;
    toRecord: () => Record<string, any>;
    toReactiveRecord: (options: {
        readonly: boolean;
    }) => ReactiveCtx;
    getCtxIdByValueId: (valueId: ValueId) => CtxId;
}
type CtxApi = {
    setup: any;
    useState: any;
    useRef: any;
    useFlag: any;
};
type CtxMatter = Record<ValueCategoryName, Record<ValueName, any>>;
type ReactiveCtx = Record<string, any>;

type MachineConfig = {
    id: string;
    status: string[];
    actions: string[];
    actionHandlers: Record<string, ActionHandler>;
    transitions: Record<string, Record<string, string | string[]>>;
    payloads?: Record<string, any>;
    router?: Record<string, (ctx: Record<string, any>) => string>;
    ctx: CtxMatter;
    initialStatus: {
        status: string | ((ctx: Record<string, any>) => string);
        options?: {
            staticSetup?: boolean;
            dynamicSetup?: boolean;
        };
    };
    options?: {
        onInvalidAction?: (action: string, status: string) => void;
        dynamicSetupCtx?: boolean;
        dynamicSetupActions?: boolean;
        sharedCtxIds?: string[];
    };
};
type MachineApi = Record<string, any>;

declare class Ctx implements IMachineCtx {
    id: string;
    values: Map<ValueId, Value>;
    subscribers: Map<ValueId, Set<React.Dispatch<Value>>>;
    valueCategories: ValueCategories;
    constructor(id: string, values: Map<ValueId, Value>, valueCategories: ValueCategories);
    getCtxIdByValueId(valueId: ValueId): string;
    dynamicSetup(ctxMatter: CtxMatter, options?: {
        overwrite: boolean;
    }): void;
    setValue(key: ValueId, value: any): void;
    getValue(key: ValueId): any;
    getValueAndSetter(key: ValueId): any;
    subscribe(key: ValueId, setValue: ReactRefValueSetter): () => void;
    toRecord(): Record<`${string}-${string}`, any>;
    _createValueProxies(ctx: Ctx, options?: {
        readonly: boolean;
    }): {};
    toReactiveRecord(options?: {
        readonly: boolean;
    }): {};
    private _notifySubscribers;
}

declare class CommandBus<T> implements ICommandBus<T> {
    commands: Map<keyof T, CommandHandler>;
    constructor(commandMap: Record<keyof T, CommandHandler>);
    execute(commandName: keyof T, params: any): any;
}
interface ICommandBus<T = Record<string, any>> {
    execute: (commandName: keyof T, params: any) => void;
}
type CommandHandler = (params: any) => void | any;

type RetomusCommandMap = {
    getMachine: (id: string) => any;
    getCtx: (id: string) => any;
    getValueCategories: () => any;
};
type RetomusEventMap = {
    machineIsReady: {
        machine: any;
    };
    ctxIsReady: {
        ctx: any;
    };
};

declare class RetomusCommandBus extends CommandBus<RetomusCommandMap> {
    constructor(retomusInstance: Retomus);
}

declare class RetomusEventBus {
    eventBus: EventBus<RetomusEventMap>;
    constructor();
    onMachineIsReady(handler: ({ machine }: {
        machine: any;
    }) => void): () => void;
    onCtxIsReady(handler: ({ ctx }: {
        ctx: string;
    }) => void): () => void;
    emitMachineIsReady(machine: any): void;
    emitCtxIsReady(ctx: any): void;
}

type RetomusConfig = {
    valueCategories: ValueCategories;
} | undefined;
declare const createRetomus: (config?: RetomusConfig) => Retomus;
declare const createRetomusConfig: (param?: {
    valueCategories: ValueCategory[];
}) => {
    valueCategories: Map<string, ValueCategory>;
};
declare class Retomus {
    machines: Map<string, any>;
    ctxs: Map<string, any>;
    stateBus: any;
    eventBus: RetomusEventBus;
    commandBus: RetomusCommandBus;
    valueCategories: Map<string, ValueCategory>;
    constructor(config: RetomusConfig);
    getValueCategories(): Map<string, ValueCategory>;
    registerValueCategory(ctxValueCategory: ValueCategory): void;
    createMachine(config: any): MachineApi;
    createCtx(id: CtxId, values: CtxMatter, options?: {}): CtxApi;
    createCompositeAction(config: CompositeActionConfig): {
        use: any;
    };
    registerMachine(id: string, machine: any): void;
    registerCtx(id: string, ctx: any): void;
    getMachine(id: string): any;
    getCtx(id: string): Ctx;
    deleteMachine(id: string): void;
    deleteCtx(id: string): void;
}

declare const RetomusWrapper: (props: any) => react_jsx_runtime.JSX.Element;

declare const createMachineConfig: (config: MachineConfig) => MachineConfig;
declare const createCompositeActionConfig: (config: any) => CompositeActionConfig;

export { RetomusWrapper, type ValueCategory, createCompositeActionConfig, createMachineConfig, createRetomus, createRetomusConfig };
