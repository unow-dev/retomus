class MergedCtx {
    constructor(ownCtx, ctxs) {
        this.ownCtx = ownCtx;
        this.ctxs = new Map(Object.entries(ctxs));
        this.valueKeyAndCtxIdMap = this._createMergedValuesKeyCtxIdMap();
        try {
            this._subscribeStateAllToAllSharedCtx();
        }
        catch (error) {
            console.error(error);
        }
    }
    _subscribeStateAllToAllSharedCtx() {
        for (const [key, ctxId] of this.valueKeyAndCtxIdMap.states) {
            if (ctxId === this.ownCtx) {
                continue;
            }
            const ctx = this.ctxs.get(ctxId);
            if (ctx) {
                ctx.subscribeState(key, value => this.setValue(key, value, 'states'));
            }
        }
    }
    setValue(key, value, category) {
        const ctxId = this.valueKeyAndCtxIdMap[category].get(key);
        if (ctxId === this.ownCtx) {
            return this.ownCtx.setValue(key, value, category);
        }
        const ctx = this.ctxs.get(ctxId);
        if (ctx) {
            return ctx.setValue(key, value, category);
        }
    }
    getValue(key, category) {
        const ctxId = this.valueKeyAndCtxIdMap[category].get(key);
        if (ctxId === this.ownCtx) {
            return this.ownCtx.getValue(key, category);
        }
        const ctx = this.ctxs.get(ctxId);
        if (ctx) {
            return ctx.getValue(key, category);
        }
    }
    dynamicSetup(ctxMatter, options) {
        for (const ctx of this.ctxs.values()) {
            ctx.dynamicSetup(ctxMatter, options);
        }
        this.ownCtx.dynamicSetup(ctxMatter, options);
    }
    subscribeState(key, setState) {
        const ctxId = this.valueKeyAndCtxIdMap.states.get(key);
        if (ctxId === this.ownCtx) {
            return this.ownCtx.subscribeState(key, setState);
        }
        const ctx = this.ctxs.get(ctxId);
        if (ctx) {
            return ctx.subscribeState(key, setState);
        }
    }
    toRecord() {
        const getStateProxy = ctx => new Proxy({}, {
            get(_, prop) {
                return ctx.getValue(prop, 'states');
            },
            set(_, prop, value) {
                return true;
            },
        });
        return {
            states: getStateProxy(this),
            refs: this._getRefsAll(),
        };
    }
    toReactiveRecord() {
        const getStateProxy = ctx => new Proxy({}, {
            get(_, prop) {
                return ctx.getValue(prop, 'states');
            },
            set(_, prop, value) {
                ctx.setValue(prop, value, 'states');
                return true;
            },
        });
        return {
            states: getStateProxy(this),
            refs: this._getRefsAll(),
        };
    }
    _getRefsAll() {
        const refs = {
            ...this.ownCtx.refs,
        };
        for (const [ctxId, ctx] of this.ctxs) {
            for (const [key, value] of Object.entries(ctx.refs)) {
                refs[key] = value;
            }
        }
        return refs;
    }
    _createMergedValuesKeyCtxIdMap() {
        var _a, _b;
        const states = new Map();
        const refs = new Map();
        this.ctxs.forEach((ctx, ctxId) => {
            var _a, _b;
            if (((_a = ctx === null || ctx === void 0 ? void 0 : ctx.states) === null || _a === void 0 ? void 0 : _a.size) > 0) {
                ctx.states.forEach((value, key) => {
                    if (states.has(key)) {
                        throw new Error(`Duplicate state key: ${key}`);
                    }
                    states.set(key, ctxId);
                });
            }
            if (((_b = ctx === null || ctx === void 0 ? void 0 : ctx.refs) === null || _b === void 0 ? void 0 : _b.size) > 0) {
                ctx.refs.forEach((value, key) => {
                    if (states.has(key)) {
                        throw new Error(`Duplicate state key: ${key}`);
                    }
                    refs.set(key, ctxId);
                });
            }
        });
        const ownCtx = this.ownCtx;
        if (((_a = ownCtx === null || ownCtx === void 0 ? void 0 : ownCtx.states) === null || _a === void 0 ? void 0 : _a.size) > 0) {
            ownCtx.states.forEach((value, key) => {
                if (states.has(key)) {
                    throw new Error(`Duplicate state key: ${key}`);
                }
                states.set(key, this.ownCtx);
            });
        }
        if (((_b = ownCtx === null || ownCtx === void 0 ? void 0 : ownCtx.refs) === null || _b === void 0 ? void 0 : _b.size) > 0) {
            ownCtx.refs.forEach((value, key) => {
                if (states.has(key)) {
                    throw new Error(`Duplicate state key: ${key}`);
                }
                refs.set(key, this.ownCtx);
            });
        }
        return {
            states,
            refs,
        };
    }
}
export default MergedCtx;
