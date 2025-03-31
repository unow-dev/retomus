import EventBus from "../../common/bus/EventBus";
import { ActionHandler } from "../../common/types/Action";
type CompositeActionConfig = {
    id: string;
    actions: ActionFlow;
    options?: {
        concurrency?: number;
    };
};
declare class CompositeActionEventBus {
    eventBus: EventBus<CompositeActionEventMap>;
    constructor();
    onReady(handler: ({ compositeAction }: {
        compositeAction: any;
    }) => void): void;
    emitReady(compositeAction: any): void;
}
type CompositeActionEventMap = {
    ready: {
        compositeAction: any;
    };
};
type ReturnUse = [execute: (payload: any) => Promise<any>, isReady: boolean];
type CompositeActionApi = {
    use: any;
};
interface ICompositeAction {
    id: string;
    actionHandlers: Map<string, ActionHandler>;
    actionFlow: ActionFlow;
    resultBus: ResultBus;
    subscribers: Record<string, Set<() => void>>;
    machineIdAndActionNames: Map<string, string[]>;
    concurrency: number;
    setHandler(actionName: ActionName, handler: ActionHandler): void;
    subscribeReady(subscriber: () => void): () => void;
    notifySubscribers(scope: any): void;
    getHooks(): CompositeActionApi;
    execute(params: ActionHandlerParams): Promise<any>;
}
type ResultBus = Record<string, any>;
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
type ActionFlowMatter = SingleActionFlowMatter | GroupActionFlowMatter;
type ActionFlow = GroupActionFlowMatter;
type ActionHandlerParams = {
    payload: any;
    results: ResultBus;
};
export { CompositeActionConfig, CompositeActionEventBus, CompositeActionEventMap, ReturnUse, CompositeActionApi, ICompositeAction, ResultBus, ActionName, SingleActionFlowMatter, GroupActionFlowMatter, ParallelActionFlowMatter, SequenceActionFlowMatter, ActionFlowMatter, ActionFlow, ActionHandlerParams, };
