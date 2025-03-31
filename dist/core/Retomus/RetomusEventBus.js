import EventBus from "../../common/bus/EventBus";
class RetomusEventBus {
    constructor() {
        this.eventBus = new EventBus();
    }
    onMachineIsReady(handler) {
        this.eventBus.on('machineIsReady', handler);
        return () => this.eventBus.off('machineIsReady', handler);
    }
    onCtxIsReady(handler) {
        this.eventBus.on('ctxIsReady', handler);
        return () => this.eventBus.off('ctxIsReady', handler);
    }
    emitMachineIsReady(machine) {
        this.eventBus.emit('machineIsReady', { machine });
    }
    emitCtxIsReady(ctx) {
        this.eventBus.emit('ctxIsReady', { ctx });
    }
}
export default RetomusEventBus;
