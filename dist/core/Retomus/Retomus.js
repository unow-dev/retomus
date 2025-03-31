import { createCompositeActionApi } from "../CompositeAction";
import CompositeAction from "../CompositeAction/CompositeAction";
import { createCtxApi, SharedCtx } from "../Ctx";
import { createMachineApi } from "../Machine";
import Machine from "../Machine/Machine";
import RetomusCommandBus from "./RetomusCommandBus";
import RetomusEventBus from "./RetomusEventBus";
class Retomus {
    constructor() {
        this.machines = new Map();
        this.ctxs = new Map();
        this.eventBus = new RetomusEventBus();
        this.commandBus = new RetomusCommandBus(this);
    }
    createMachine(config) {
        const machine = new Machine(config, this.eventBus, this.commandBus);
        this.registerMachine(config.id, machine);
        return createMachineApi(machine);
    }
    createCtx(config) {
        const ctx = new SharedCtx(config.id, config.states, config.refs);
        this.registerCtx(config.id, ctx);
        return createCtxApi(ctx);
    }
    createCompositeAction(config) {
        const compositeAction = new CompositeAction(config, this.eventBus);
        return createCompositeActionApi(compositeAction);
    }
    registerMachine(id, machine) {
        this.machines.set(id, machine);
    }
    registerCtx(id, ctx) {
        this.ctxs.set(id, ctx);
    }
    getMachine(id) {
        return this.machines.get(id);
    }
    getCtx(id) {
        return this.ctxs.get(id);
    }
    deleteMachine(id) {
        this.machines.delete(id);
    }
    deleteCtx(id) {
        this.ctxs.delete(id);
    }
    addValueCategory(customValueCategories) {
        this.customValueCategories = customValueCategories;
    }
}
export default Retomus;
