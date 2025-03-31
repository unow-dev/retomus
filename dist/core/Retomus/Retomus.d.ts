import { ValueCategories } from "../../common/types/Value";
import { CompositeActionConfig } from "../CompositeAction/types";
import { CtxApi } from "../Ctx/types";
import { MachineApi } from "../Machine/types";
import RetomusCommandBus from "./RetomusCommandBus";
import RetomusEventBus from "./RetomusEventBus";
declare class Retomus {
    machines: Map<string, any>;
    ctxs: Map<string, any>;
    stateBus: any;
    customValueCategories: ValueCategories;
    eventBus: RetomusEventBus;
    commandBus: RetomusCommandBus;
    constructor();
    createMachine(config: any): MachineApi;
    createCtx(config: any): CtxApi;
    createCompositeAction(config: CompositeActionConfig): {
        use: any;
    };
    registerMachine(id: string, machine: any): void;
    registerCtx(id: string, ctx: any): void;
    getMachine(id: string): any;
    getCtx(id: string): any;
    deleteMachine(id: string): void;
    deleteCtx(id: string): void;
    addValueCategory(customValueCategories: ValueCategories): void;
}
export default Retomus;
