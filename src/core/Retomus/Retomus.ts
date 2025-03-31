import { ValueCategories } from "../../common/types/Value";
import { createCompositeActionApi } from "../CompositeAction";
import CompositeAction from "../CompositeAction/CompositeAction";
import { CompositeActionConfig } from "../CompositeAction/types";
import { createCtxApi, SharedCtx } from "../Ctx";
import { CtxApi } from "../Ctx/types";
import { createMachineApi } from "../Machine";
import Machine from "../Machine/Machine";
import { MachineApi } from "../Machine/types";
import RetomusCommandBus from "./RetomusCommandBus";
import RetomusEventBus from "./RetomusEventBus";

class Retomus {
   machines: Map<string, any> = new Map<string, any>();
   ctxs: Map<string, any> = new Map<string, any>();
   stateBus: any;
   customValueCategories: ValueCategories;
   eventBus: RetomusEventBus;
   commandBus: RetomusCommandBus;

   constructor() {
      this.eventBus = new RetomusEventBus();
      this.commandBus = new RetomusCommandBus(this);
   }

   createMachine(config): MachineApi {
      const machine = new Machine(config, this.eventBus, this.commandBus);
      this.registerMachine(config.id, machine);
      return createMachineApi(machine);
   }

   createCtx(config): CtxApi {
      const ctx = new SharedCtx(config.id, config.states, config.refs);

      this.registerCtx(config.id, ctx);
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

   getCtx(id: string) {

      return this.ctxs.get(id);
   }

   deleteMachine(id: string) {
      this.machines.delete(id);
   }

   deleteCtx(id: string) {
      this.ctxs.delete(id);
   }

   addValueCategory(customValueCategories: ValueCategories) {
      this.customValueCategories = customValueCategories;
   }
}

export default Retomus;