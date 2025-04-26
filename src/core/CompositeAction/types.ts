import EventBus from "../../common/bus/EventBus";
import { ActionHandler } from "../../common/types/Action";

type CompositeActionConfig = {
   id: string;
   action: ActionFlow;
   options?: {
      concurrency?: number
   }
};

class CompositeActionEventBus {
   eventBus: EventBus<CompositeActionEventMap> = new EventBus();
   constructor() {}
   onReady(handler: ({ compositeAction }: { compositeAction: any }) => void) {
      this.eventBus.on('ready', handler);
   }
   emitReady(compositeAction: any) {
      compositeAction.notifyReady();
      this.eventBus.emit('ready', { compositeAction });
   }
}

type CompositeActionEventMap = {
   ready: { compositeAction: any };
};

type ReturnUse = [execute: (payload) => Promise<any>, isReady: boolean];

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
   notifySubscribers(scope): void;
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
type GroupActionFlowMatter =
   | ParallelActionFlowMatter
   | SequenceActionFlowMatter;
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

export {
   CompositeActionConfig,
   CompositeActionEventBus,
   CompositeActionEventMap,
   ReturnUse,
   CompositeActionApi,
   ICompositeAction,
   ResultBus,
   ActionName,
   SingleActionFlowMatter,
   GroupActionFlowMatter,
   ParallelActionFlowMatter,
   SequenceActionFlowMatter,
   ActionFlowMatter,
   ActionFlow,
   ActionHandlerParams,
};