import EventBus from "../../common/bus/EventBus";
class CompositeActionEventBus {
    constructor() {
        this.eventBus = new EventBus();
    }
    onReady(handler) {
        this.eventBus.on('ready', handler);
    }
    emitReady(compositeAction) {
        compositeAction.notifyReady();
        this.eventBus.emit('ready', { compositeAction });
    }
}
export { CompositeActionEventBus, };
