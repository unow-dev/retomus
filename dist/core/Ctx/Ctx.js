class Ctx {
    constructor(id, states = {}, refs = {}) {
        this.stateSubscribers = new Map();
        this.id = id;
        this.states = new Map(Object.entries(states));
        this.refs = refs;
    }
    dynamicSetup(ctxMatter, options) {
        var _a, _b;
        const stateEntries = Object.entries((_a = ctxMatter === null || ctxMatter === void 0 ? void 0 : ctxMatter.states) !== null && _a !== void 0 ? _a : {});
        if (options === null || options === void 0 ? void 0 : options.overwrite) {
            for (const [key, value] of stateEntries) {
                this.states.set(key, value);
            }
            this.refs = (_b = ctxMatter === null || ctxMatter === void 0 ? void 0 : ctxMatter.refs) !== null && _b !== void 0 ? _b : {};
        }
        else {
            for (const [key, value] of stateEntries) {
                this.states.set(key, value);
            }
        }
        for (const [key, value] of this.states) {
            this._notifyStateSubscribers(key, value);
        }
    }
    setValue(key, value, category) {
        if (category === 'states') {
            this._setState(key, value);
        }
        else {
            this[category][key] = value;
        }
    }
    getValue(key, category) {
        if (category === 'states') {
            return this.states.get(key);
        }
        else {
            return this[category][key];
        }
    }
    subscribeState(key, setState) {
        var _a;
        if (!this.stateSubscribers.has(key)) {
            this.stateSubscribers.set(key, new Set());
        }
        (_a = this.stateSubscribers.get(key)) === null || _a === void 0 ? void 0 : _a.add(setState);
        return () => {
            var _a;
            (_a = this.stateSubscribers.get(key)) === null || _a === void 0 ? void 0 : _a.delete(setState);
        };
    }
    toRecord() {
        return {
            states: Object.fromEntries(this.states),
            refs: this.refs,
        };
    }
    toReactiveRecord() {
        const getStateProxy = ctx => new Proxy({}, {
            get(_, prop) {
                return ctx.getValue(prop, 'states');
            },
            set(_, prop, value) {
                ctx._setState(prop, value);
                return true;
            },
        });
        return {
            states: getStateProxy(this),
            refs: this.refs,
        };
    }
    _setState(key, value) {
        if (this.states.get(key) !== value) {
            this.states.set(key, value);
            this._notifyStateSubscribers(key, value);
        }
    }
    _notifyStateSubscribers(key, value) {
        var _a;
        (_a = this.stateSubscribers.get(key)) === null || _a === void 0 ? void 0 : _a.forEach(setState => {
            setState(value);
        });
    }
}
export default Ctx;
