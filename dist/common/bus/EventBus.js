class EventBus {
    constructor() {
        this.listeners = {};
    }
    on(event, handler) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(handler);
    }
    off(event, handler) {
        var _a;
        this.listeners[event] = ((_a = this.listeners[event]) !== null && _a !== void 0 ? _a : []).filter(h => h !== handler);
    }
    emit(event, payload) {
        var _a;
        (_a = this.listeners[event]) === null || _a === void 0 ? void 0 : _a.forEach(handler => handler(payload));
    }
}
export default EventBus;
