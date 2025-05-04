var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  RetomusWrapper: () => RetomusWrapper_default,
  createCompositeActionConfig: () => createCompositeActionConfig,
  createMachineConfig: () => createMachineConfig,
  createRetomus: () => createRetomus,
  createRetomusConfig: () => createRetomusConfig
});
module.exports = __toCommonJS(index_exports);

// src/common/utils/index.ts
var withUpperCaseFirstLetter = (str) => str.charAt(0).toUpperCase() + str.slice(1);
var createValueId = (valueName, categoryId) => `${categoryId}-${valueName}`;
var compileValuesRecordToMap = (record, ctxId) => {
  const map = /* @__PURE__ */ new Map();
  for (const [categoryId, values] of Object.entries(record)) {
    for (const [valueName, value] of Object.entries(values)) {
      map.set(createValueId(valueName, categoryId), value);
    }
  }
  return map;
};
var compileValuesMapToRecord = (map) => Object.fromEntries(map);

// src/core/CompositeAction/index.ts
var createCompositeActionApi = (compositeAction) => {
  const hooks = compositeAction.getHooks();
  return {
    use: hooks.use
  };
};

// src/core/CompositeAction/CompositeAction.ts
var import_react = require("react");

// src/common/bus/EventBus.ts
var EventBus = class {
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
    this.listeners[event] = (this.listeners[event] ?? []).filter(
      (h) => h !== handler
    );
  }
  emit(event, payload) {
    this.listeners[event]?.forEach((handler) => handler(payload));
  }
};
var EventBus_default = EventBus;

// src/core/CompositeAction/types.ts
var CompositeActionEventBus = class {
  constructor() {
    this.eventBus = new EventBus_default();
  }
  onReady(handler) {
    this.eventBus.on("ready", handler);
  }
  emitReady(compositeAction) {
    compositeAction.notifyReady();
    this.eventBus.emit("ready", { compositeAction });
  }
};

// src/core/CompositeAction/CompositeAction.ts
var CompositeAction = class {
  constructor(config, retomusEventBus) {
    this.id = "";
    this.actionHandlers = /* @__PURE__ */ new Map();
    this.actionFlow = { type: "sequence", actions: [] };
    this.resultBus = {};
    this.subscribers = {};
    this.machineIdAndActionNames = /* @__PURE__ */ new Map();
    this.eventBus = new CompositeActionEventBus();
    this.totalOfActions = 0;
    this.countOfReadyActions = 0;
    this.concurrency = 1;
    this.currentExecutionCount = 0;
    this._executeAction = async (actionName, payload) => {
      if (this.currentExecutionCount >= this.concurrency) return;
      this.currentExecutionCount++;
      const actionHandler = this.actionHandlers.get(actionName);
      if (actionHandler) {
        try {
          await actionHandler(payload);
        } catch (error) {
          console.error(error);
        }
      }
      this.currentExecutionCount--;
    };
    this._handleActionFlowMatter = async (actionFlowMatter, payload) => {
      if (actionFlowMatter.type === "action") {
        await this._executeAction(actionFlowMatter.actionName, payload);
      } else if (actionFlowMatter.type === "sequence") {
        await this._handleSequenceActionFlowMatter(actionFlowMatter, payload);
      } else if (actionFlowMatter.type === "parallel") {
        await this._handleParallelActionFlowMatter(actionFlowMatter, payload);
      }
    };
    this._handleSequenceActionFlowMatter = async (_actionFlowMatter, payload) => {
      for (const actionFlowMatter of _actionFlowMatter.actions) {
        if (actionFlowMatter.type === "action") {
          await this._executeAction(actionFlowMatter.actionName, payload);
        } else {
          await this._handleActionFlowMatter(actionFlowMatter, payload);
        }
      }
    };
    this._handleParallelActionFlowMatter = async (_actionFlowMatter, payload) => {
      const promises = _actionFlowMatter.actions.map((actionFlowMatter) => {
        if (actionFlowMatter.type === "action") {
          return this._executeAction(actionFlowMatter.actionName, payload);
        } else {
          return this._handleActionFlowMatter(actionFlowMatter, payload);
        }
      });
      await Promise.all(promises);
    };
    this.id = config.id;
    this.resultBus = {};
    this.retomusEventBus = retomusEventBus;
    this._processActionFlowMatters(config.action);
    if (config?.options && config?.options?.concurrency) {
      this.concurrency = config.options.concurrency;
    }
  }
  _processActionFlowMatters(actionFlowMatters) {
    this.actionFlow = actionFlowMatters;
    actionFlowMatters.actions.forEach((actionFlowMatter) => {
      this._processActionFlowMatter(actionFlowMatter);
    });
  }
  _processActionFlowMatter(actionFlowMatter) {
    if (actionFlowMatter.type === "action") {
      this._processSingleActionFlowMatter(actionFlowMatter);
    }
    if (actionFlowMatter.type === "parallel") {
      this._processParallelActionFlowMatter(actionFlowMatter);
    }
    if (actionFlowMatter.type === "sequence") {
      this._processSequenceActionFlowMatter(actionFlowMatter);
    }
  }
  _processSingleActionFlowMatter(actionFlowMatter) {
    if (!this.machineIdAndActionNames.has(actionFlowMatter.machineId)) {
      this.machineIdAndActionNames.set(actionFlowMatter.machineId, []);
    }
    this.machineIdAndActionNames.get(actionFlowMatter.machineId)?.push(actionFlowMatter.actionName);
    const off = this.retomusEventBus.onMachineIsReady(({ machine }) => {
      if (machine.id === actionFlowMatter.machineId) {
        this.actionHandlers.set(
          actionFlowMatter.actionName,
          async (payload) => await machine._executeAction(
            actionFlowMatter.actionName,
            payload
          )
        );
        off();
      }
    });
    this.totalOfActions++;
  }
  setHandler(actionName, handler) {
    this.actionHandlers.set(actionName, handler);
    this.countOfReadyActions++;
    if (this.countOfReadyActions === this.totalOfActions) {
      this.eventBus.emitReady(this);
    }
  }
  _processParallelActionFlowMatter(actionFlowMatter) {
    actionFlowMatter.actions.forEach((actionFlowMatter2) => {
      if (actionFlowMatter2.type === "action") {
        this._processSingleActionFlowMatter(actionFlowMatter2);
      } else {
        this._processActionFlowMatter(actionFlowMatter2);
      }
    });
  }
  _processSequenceActionFlowMatter(actionFlowMatter) {
    actionFlowMatter.actions.forEach((actionFlowMatter2) => {
      if (actionFlowMatter2.type === "action") {
        this._processSingleActionFlowMatter(actionFlowMatter2);
      } else {
        this._processActionFlowMatter(actionFlowMatter2);
      }
    });
  }
  subscribe(subscriber, scope) {
    if (!this.subscribers[scope]) {
      this.subscribers[scope] = /* @__PURE__ */ new Set();
    }
    this.subscribers[scope].add(subscriber);
    return () => {
      this.subscribers[scope].delete(subscriber);
    };
  }
  subscribeReady(subscriber) {
    return this.subscribe(subscriber, "ready");
  }
  notifySubscribers(scope) {
    if (!this.subscribers[scope]) {
      return;
    }
    this.subscribers[scope].forEach((subscriber) => subscriber());
  }
  notifyReady() {
    this.notifySubscribers("ready");
  }
  getHooks() {
    return {
      use: useIn(this)
    };
  }
  async execute(payload) {
    await this._handleActionFlowMatter(this.actionFlow, payload);
    return this.resultBus;
  }
};
var useIn = (instance) => () => {
  const [execute, setExecute] = (0, import_react.useState)(() => (payload) => {
    return instance.execute({ results: instance.resultBus, payload });
  });
  const [isReady, setIsReady] = (0, import_react.useState)(false);
  (0, import_react.useEffect)(() => {
    const unsubscribe = instance.subscribeReady(() => {
      setExecute(() => (payload) => {
        return instance.execute({ results: instance.resultBus, payload });
      });
      setIsReady(true);
    });
    return unsubscribe;
  }, [setExecute, setIsReady]);
  return [execute, isReady];
};
var CompositeAction_default = CompositeAction;

// src/core/Ctx/Ctx.ts
var Ctx = class {
  constructor(id, values = /* @__PURE__ */ new Map(), valueCategories) {
    this.values = /* @__PURE__ */ new Map();
    this.subscribers = /* @__PURE__ */ new Map();
    this.valueCategories = /* @__PURE__ */ new Map();
    this.id = id;
    this.values = values;
    this.valueCategories = valueCategories;
    this.values.forEach((_, valueId) => {
      this.subscribers.set(valueId, /* @__PURE__ */ new Set());
    });
  }
  getCtxIdByValueId(valueId) {
    return this.id;
  }
  dynamicSetup(ctxMatter, options = { overwrite: true }) {
    const needNotify = [];
    const newValues = compileValuesRecordToMap(ctxMatter, this.id);
    newValues.forEach((value, valueId) => {
      if (!this.values.has(valueId)) {
        this.setValue(valueId, value);
      }
      const newValue = value;
      const oldValue = this.getValue(valueId);
      if (newValue !== oldValue && options.overwrite) {
        this.setValue(valueId, newValue);
        needNotify.push([valueId, newValue]);
      }
    });
    for (const [valueId, value] of needNotify) {
      this._notifySubscribers(valueId, value);
    }
  }
  setValue(key, value) {
    this.values.set(key, value);
    this._notifySubscribers(key, value);
  }
  getValue(key) {
    return this.values.get(key);
  }
  getValueAndSetter(key) {
    return this.values.get(key);
  }
  subscribe(key, setValue) {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, /* @__PURE__ */ new Set());
    }
    this.subscribers.get(key)?.add(setValue);
    return () => {
      this.subscribers.get(key)?.delete(setValue);
    };
  }
  toRecord() {
    return compileValuesMapToRecord(this.values);
  }
  _createValueProxies(ctx, options = { readonly: false }) {
    const proxies = {};
    ctx.valueCategories.forEach((_value, valueCategoryName) => {
      proxies[valueCategoryName] = new Proxy(
        {},
        {
          get(target, prop) {
            if (typeof prop === "symbol") {
              return target[prop];
            }
            const valueId = createValueId(prop, valueCategoryName);
            if (ctx.values.has(valueId)) {
              return ctx.getValue(valueId);
            }
          },
          set(target, prop, value) {
            if (options.readonly) {
              return true;
            }
            if (typeof prop === "symbol") {
              return true;
            }
            const valueId = createValueId(prop, valueCategoryName);
            if (ctx.values.has(valueId)) {
              ctx.setValue(valueId, value);
              return true;
            }
            return true;
          }
        }
      );
    });
    return proxies;
  }
  toReactiveRecord(options = { readonly: false }) {
    return this._createValueProxies(this, options);
  }
  _notifySubscribers(valueId, value) {
    if (!this.subscribers.get(valueId)) {
      return;
    }
    this.subscribers.get(valueId)?.forEach((setState) => {
      setState(value);
    });
  }
};
var Ctx_default = Ctx;

// src/common/hooks/index.ts
var import_react3 = require("react");

// src/react/RetomusWrapper.tsx
var import_react2 = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var RetomusWrapperContext = (0, import_react2.createContext)({
  refs: /* @__PURE__ */ new Map()
});
var RetomusWrapper = (props) => {
  const refs = (0, import_react2.useRef)(/* @__PURE__ */ new Map());
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RetomusWrapperContext.Provider, { value: { refs }, children: props.children });
};
var RetomusWrapper_default = RetomusWrapper;

// src/common/hooks/index.ts
var valueHook = (hookProvider, category) => (key) => {
  const valueId = createValueId(key, category.id);
  const { refs } = (0, import_react3.useContext)(RetomusWrapperContext);
  const ctxIdOfValueId = hookProvider.getCtxIdByValueId(valueId);
  const [value, setValue] = category.use(hookProvider.getValue(valueId));
  const unsubscribeRef = (0, import_react3.useRef)(null);
  const initializedRef = (0, import_react3.useRef)(false);
  (0, import_react3.useEffect)(() => {
    if (category.setterType === "state") {
      hookProvider.setValue(valueId, value);
      unsubscribeRef.current = hookProvider.subscribe(valueId, setValue);
    }
  }, [setValue, valueId, value]);
  const target = (0, import_react3.useRef)(refs.current);
  (0, import_react3.useEffect)(() => {
    if (category.setterType === "ref" && !initializedRef.current) {
      if (!target.current.has(ctxIdOfValueId)) {
        target.current.set(ctxIdOfValueId, /* @__PURE__ */ new Map());
      }
      target.current = target.current.get(ctxIdOfValueId);
      if (!target.current.has(category.id)) {
        target.current.set(category.id, /* @__PURE__ */ new Map());
      }
      target.current = target.current.get(category.id);
      if (target.current.has(valueId)) {
        setValue(null);
        initializedRef.current = true;
      } else {
        target.current.set(valueId, value);
        hookProvider.setValue(valueId, value[category.valuePropName]);
        unsubscribeRef.current = hookProvider.subscribe(valueId, setValue);
        initializedRef.current = true;
      }
    }
  }, []);
  (0, import_react3.useEffect)(() => {
    if (category.setterType === "ref") {
      unsubscribeRef.current = hookProvider.subscribe(valueId, setValue);
    }
  }, [setValue]);
  (0, import_react3.useEffect)(() => {
    return () => {
      if (category.setterType === "state") {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
      }
    };
  }, []);
  return category.setterType === "state" ? value : refs.current?.get(ctxIdOfValueId)?.get(category.id)?.get(valueId) || value;
};
var createValueHooks = (hookProvider, valueCategories) => {
  const hooks = {};
  valueCategories.forEach((category) => {
    hooks[`use${withUpperCaseFirstLetter(category.id)}`] = valueHook(
      hookProvider,
      category
    );
  });
  return hooks;
};

// src/core/Ctx/hooks.ts
var createSharedCtxValueHooks = (ctx, categories) => createValueHooks(ctx, categories);

// src/core/Ctx/SharedCtx.ts
var SharedCtx = class extends Ctx_default {
  constructor(id, values = /* @__PURE__ */ new Map(), valueCategories) {
    super(id, values, valueCategories);
    this.flagBus = {
      isReady: false
    };
  }
  createHooks() {
    return createSharedCtxValueHooks(this, this.valueCategories);
  }
};
var SharedCtx_default = SharedCtx;

// src/core/Ctx/MergedCtx.ts
var MergedCtx = class {
  constructor(ownCtx, ctxs, valueCategories) {
    this.ownCtx = ownCtx;
    this.ctxs = new Map(Object.entries({ [ownCtx.id]: ownCtx, ...ctxs }));
    this.valueIdAndCtxIdMap = this._createValuesIdAndCtxIdMap();
    this.valueCategories = valueCategories;
  }
  getCtxIdByValueId(valueId) {
    return this.valueIdAndCtxIdMap.get(valueId);
  }
  setValue(key, value) {
    const ctxId = this.valueIdAndCtxIdMap.get(key);
    const ctx = this.ctxs.get(ctxId);
    if (ctx) {
      return ctx.setValue(key, value);
    }
  }
  getValue(key) {
    const ctxId = this.valueIdAndCtxIdMap.get(key);
    const ctx = this.ctxs.get(ctxId);
    if (ctx) {
      return ctx.getValue(key);
    }
  }
  dynamicSetup(ctxMatter, options) {
    for (const ctx of this.ctxs.values()) {
      ctx.dynamicSetup(ctxMatter, options);
    }
    this.ownCtx.dynamicSetup(ctxMatter, options);
  }
  subscribe(key, setState) {
    const ctxId = this.valueIdAndCtxIdMap.get(key);
    const ctx = this.ctxs.get(ctxId);
    if (ctx) {
      return ctx.subscribe(key, setState);
    }
  }
  _createValueProxies(mergedCtx, options = {
    readonly: false
  }) {
    const proxies = {};
    const getHandle = (target, prop, valueCategoryName) => {
      if (typeof prop === "symbol") {
        return target[prop];
      }
      const valueId = createValueId(prop, valueCategoryName);
      const ctxId = mergedCtx.valueIdAndCtxIdMap.get(valueId);
      console.log(ctxId);
      console.log(mergedCtx.valueIdAndCtxIdMap);
      if (!ctxId) {
        return target[prop];
      } else {
        const ctx = mergedCtx.ctxs.get(ctxId);
        console.log(mergedCtx.ctxs);
        console.log(ctx);
        if (ctx.values.has(valueId)) {
          return ctx.getValue(valueId);
        }
      }
    };
    const setHandle = (target, prop, value, valueCategoryName) => {
      const valueId = createValueId(prop, valueCategoryName);
      const ctxId = mergedCtx.valueIdAndCtxIdMap.get(valueId);
      if (!ctxId) {
        return true;
      } else {
        const ctx = mergedCtx.ctxs.get(ctxId);
        if (ctx) {
          ctx.setValue(valueId, value);
          return true;
        }
      }
    };
    const setHandleReadOnly = () => {
      return true;
    };
    const createProxies = (getHandle2, setHandle2) => {
      const proxies2 = {};
      mergedCtx.valueCategories.forEach((_value, valueCategoryName) => {
        proxies2[valueCategoryName] = new Proxy(
          {},
          {
            get(target, prop) {
              return getHandle2(target, prop, valueCategoryName);
            },
            set(target, prop, value) {
              return setHandle2(target, prop, value, valueCategoryName);
            }
          }
        );
      });
      return proxies2;
    };
    return createProxies(
      getHandle,
      options.readonly ? setHandleReadOnly : setHandle
    );
  }
  _createValueProxiesReadOnly(mergedCtx) {
    const proxies = {};
    const getHandle = (target, prop, valueCategoryName) => {
      if (typeof prop === "symbol") {
        return target[prop];
      }
      const valueId = createValueId(prop, valueCategoryName);
      const ctxId = mergedCtx.valueIdAndCtxIdMap.get(valueId);
      if (!ctxId) {
        return target[prop];
      } else {
        const ctx = mergedCtx.ctxs.get(ctxId);
        if (ctx.values.has(valueId)) {
          return ctx.getValue(valueId);
        }
      }
    };
    const setHandle = () => {
      return true;
    };
    mergedCtx.valueCategories.forEach((_value, valueCategoryName) => {
      proxies[valueCategoryName] = new Proxy(
        {},
        {
          get(target, prop) {
            return getHandle(target, prop, valueCategoryName);
          },
          set(_, prop, value) {
            return setHandle();
          }
        }
      );
    });
    return proxies;
  }
  toRecord() {
    return this._createValueProxiesReadOnly(this);
  }
  toReactiveRecord({ readonly } = { readonly: false }) {
    return this._createValueProxies(this, { readonly });
  }
  _createValuesIdAndCtxIdMap() {
    const valuesIdAndCtxIdMap = /* @__PURE__ */ new Map();
    const ctxs = [this.ownCtx, ...this.ctxs.values()];
    for (const ctx of ctxs) {
      ctx.values.forEach((valueObj, valueId) => {
        valuesIdAndCtxIdMap.set(valueId, ctx.id);
      });
    }
    return valuesIdAndCtxIdMap;
  }
};
var MergedCtx_default = MergedCtx;

// src/core/Ctx/index.ts
var createCtxApi = (ctx) => {
  const hooks = ctx.createHooks();
  return {
    setup: ({ ctx: ctx2, options }) => {
      ctx2.dynamicSetup(ctx2, options);
    },
    ...hooks,
    useFlag: hooks.useFlag
  };
};

// src/core/Machine/Machine.ts
var import_react4 = require("react");

// src/core/Machine/constants.ts
var DEFAULT_STATUS = Symbol("default");

// src/core/Machine/hooks.ts
var createMachineValueHooks = (machine, categories) => {
  return createValueHooks(machine, categories);
};

// src/core/Machine/Machine.ts
var Machine = class {
  constructor(config, retomusEventBus, retomusCommandBus, valueCategories) {
    this.status = DEFAULT_STATUS;
    this.statusSubscribers = /* @__PURE__ */ new Set();
    this.ctx = { single: null, merged: null };
    this.actionHandlers = /* @__PURE__ */ new Map();
    this.sharedCtxIds = [];
    this.typeBus = { ctx: "single" };
    this.stateBus = {
      isDoneSetupStatus: false,
      isDoneStaticCtxSetup: false,
      isDoneDynamicCtxSetup: false
    };
    this.flagBus = { isReady: false, isReadyCtx: false, isReadyActions: false };
    this.flagSubscribers = {};
    this.id = config.id;
    this.config = config;
    this.retomusEventBus = retomusEventBus;
    this.retomusCommandBus = retomusCommandBus;
    this.valueCategories = valueCategories;
    this._staticSetupCtx(config.ctx);
    this._staticSetupStatus(config.initialStatus);
    this._staticSetupActionHandlers(config.actionHandlers);
    const options = config?.options;
    if (options) {
      this._updateIsReadyCtx(!options?.dynamicSetupCtx);
      this._updateIsReadyActions(!options?.dynamicSetupActions);
      this._updateIsReady();
      if (options?.sharedCtxIds) {
        this.sharedCtxIds = options.sharedCtxIds;
        const ctxs = this.sharedCtxIds.reduce((acc, ctxId) => {
          acc[ctxId] = this.retomusCommandBus.execute("getCtx", ctxId);
          return acc;
        }, {});
        this._setupMergedCtx(ctxs);
      }
    } else {
      this._updateIsReadyCtx(true);
      this._updateIsReadyActions(true);
      this._updateIsReady();
    }
  }
  getCtxIdByValueId(valueId) {
    return this.ctx[this.typeBus.ctx]?.getCtxIdByValueId(valueId);
  }
  setValue(key, value) {
    this.ctx[this.typeBus.ctx]?.setValue(key, value);
  }
  getValue(key) {
    return this.ctx[this.typeBus.ctx]?.getValue(key);
  }
  dynamicSetup(ctxMatter, actionHandlers, options = { ctx: { overwrite: true }, actionHandlers: {} }) {
    let enableDynamicSetupCtx = true;
    let enableDynamicSetupActions = true;
    if (this.config?.options) {
      enableDynamicSetupCtx = this.config.options?.dynamicSetupCtx;
      enableDynamicSetupActions = this.config.options?.dynamicSetupActions;
    }
    if (enableDynamicSetupCtx) {
      if (ctxMatter) {
        this.ctx[this.typeBus?.ctx]?.dynamicSetup(ctxMatter, options.ctx);
      }
      this._updateIsReadyCtx(true);
    }
    this._dynamicSetupStatus(this.config.initialStatus);
    if (enableDynamicSetupActions) {
      if (actionHandlers) {
        this._dynamicSetupActionHandlers(
          actionHandlers,
          options.actionHandlers
        );
      }
      this._updateIsReadyActions(true);
    }
  }
  subscribeStatus(setStatus) {
    this.statusSubscribers.add(setStatus);
    return () => {
      this.statusSubscribers.delete(setStatus);
    };
  }
  subscribe(key, setState) {
    return this.ctx[this.typeBus.ctx]?.subscribe(key, setState);
  }
  // --- hooks ---
  createHooks() {
    const useMachineStatusIn = (machine) => () => {
      const [status, setStatus] = (0, import_react4.useState)(machine.status);
      const subscribeStatus = (0, import_react4.useCallback)(
        () => machine.subscribeStatus(setStatus),
        [setStatus]
      );
      (0, import_react4.useEffect)(() => {
        const unsubscribe = subscribeStatus();
        return unsubscribe;
      }, [subscribeStatus]);
      return status;
    };
    const useMachineActionIn = (machine) => (key) => {
      return (payload) => machine._executeAction(key, payload);
    };
    const useMachineFlagIn = (machine) => (key) => {
      const [flag, setFlag] = (0, import_react4.useState)(machine.flagBus[key]);
      const subscribeFlag = (0, import_react4.useCallback)(
        () => machine._subscribeFlag(key, setFlag),
        [setFlag]
      );
      (0, import_react4.useEffect)(() => {
        const unsubscribe = subscribeFlag();
        return unsubscribe;
      }, [subscribeFlag]);
      return flag;
    };
    return {
      useStatus: useMachineStatusIn(this),
      useAction: useMachineActionIn(this),
      ...createMachineValueHooks(this, this.valueCategories),
      useFlag: useMachineFlagIn(this)
    };
  }
  // --- private ---
  // flag
  _setFlag(key, value) {
    this.flagBus[key] = value;
    this._notifyFlagSubscribers(key);
  }
  _updateIsReady() {
    if (this.flagBus.isReady) return;
    if (this.flagBus.isReadyCtx && this.flagBus.isReadyActions) {
      this._setFlag("isReady", true);
      this._notifyFlagSubscribers("isReady");
      this.retomusEventBus.emitMachineIsReady(this);
    } else {
      if (!this.flagBus.isReadyCtx) {
        this._subscribeFlag(
          "isReadyCtx",
          (value) => this._updateIsReady()
        );
      }
      if (!this.flagBus.isReadyActions) {
        this._subscribeFlag(
          "isReadyActions",
          (value) => this._updateIsReady()
        );
      }
    }
  }
  _updateIsReadyCtx(value) {
    if (value === this.flagBus.isReadyCtx) return;
    this.flagBus.isReadyCtx = value;
    this._notifyFlagSubscribers("isReadyCtx");
  }
  _updateIsReadyActions(value) {
    if (value === this.flagBus.isReadyActions) return;
    if (value && this.flagBus.isReadyCtx) {
      this.flagBus.isReadyActions = true;
      this._notifyFlagSubscribers("isReadyActions");
    } else {
      this._subscribeFlag("isReadyCtx", (value2) => {
        this._updateIsReadyActions(value2);
      });
    }
  }
  _notifyFlagSubscribers(key) {
    if (this.flagSubscribers[key]) {
      for (const subscriber of this.flagSubscribers[key]) {
        subscriber(this.flagBus[key]);
      }
    }
  }
  _subscribeFlag(key, callback) {
    if (!this.flagSubscribers[key]) {
      this.flagSubscribers[key] = /* @__PURE__ */ new Set();
    }
    this.flagSubscribers[key].add(callback);
    return () => {
      this.flagSubscribers[key].delete(callback);
    };
  }
  // action
  _staticSetupActionHandlers(actionHandlers) {
    this.actionHandlers = new Map(Object.entries(actionHandlers));
  }
  _dynamicSetupActionHandlers(actionHandlers, options) {
    const overwrite = options?.overwrite || false;
    if (overwrite) {
      this.actionHandlers = new Map(Object.entries(actionHandlers));
    } else {
      for (const [key, value] of Object.entries(actionHandlers)) {
        this.actionHandlers.set(key, value);
      }
    }
  }
  async _executeAction(action, payload) {
    if (this.flagBus.isReadyActions === false) return;
    if (this._validateAction(action) === false) return;
    const handler = this.actionHandlers.get(action);
    let returnValues;
    if (handler) {
      try {
        returnValues = await this._processActionHandler(handler, payload);
      } catch (error) {
        console.error("Error occurred during processing action:", error);
      }
    }
    return this._processTransitionSuccess(returnValues, action);
  }
  _processActionHandler(handler, payload) {
    return new Promise((resolve, reject) => {
      try {
        handler({
          ctx: this.ctx[this.typeBus.ctx]?.toReactiveRecord(),
          payload,
          done: (returnValues = {}) => {
            resolve(returnValues);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }
  _validateAction(action) {
    const status = this.status;
    if (status === DEFAULT_STATUS) {
      return false;
    }
    if (!this.config.actions.includes(action)) {
      return false;
    }
    if (!this.config.transitions[status][action]) {
      return false;
    }
    return true;
  }
  // transition
  _processTransitionError(error, action) {
    const onInvalidAction = this.config.onInvalidAction;
    if (onInvalidAction) {
      onInvalidAction(action, this.status);
    }
    console.error("Error occurred during processing action:", error);
  }
  _processTransitionSuccess(returnValues, action) {
    const nextStatus = this.config.transitions[this.status][action];
    if (typeof nextStatus === "string") {
      this._transitionStatus(nextStatus);
    } else {
      const router = this.config.router;
      try {
        const routedStatus = router[action](
          this.ctx[this.typeBus.ctx].toReactiveRecord({ readonly: true })
        );
        this._transitionStatus(routedStatus);
      } catch (error) {
      }
    }
    return returnValues;
  }
  // status
  _staticSetupStatus(initialStatus) {
    const { status, options } = initialStatus;
    if (typeof status === "string") {
      this.status = status;
    } else if (options.staticSetup) {
      this.status = status(
        this.ctx.single?.toReactiveRecord({ readonly: true })
      );
    }
  }
  _dynamicSetupStatus(initialStatus) {
    const { status, options } = initialStatus;
    if (typeof status === "function" && options.dynamicSetup) {
      this.status = status(this.ctx[this.typeBus.ctx]?.toRecord());
      this._notifyStatusSubscribers();
    }
  }
  _notifyStatusSubscribers() {
    this.statusSubscribers.forEach((setStatus) => {
      setStatus(this.status);
    });
  }
  _transitionStatus(status) {
    this.status = status;
    this._notifyStatusSubscribers();
  }
  // ctx
  _staticSetupCtx(ctx) {
    const ctxMatter = ctx;
    this._setupSingleCtx(ctxMatter);
  }
  _setupSingleCtx(ctxMatter) {
    const singleCtx = new Ctx_default(
      this.id,
      compileValuesRecordToMap(ctxMatter, this.id),
      this.valueCategories
    );
    this.ctx.single = singleCtx;
    this.typeBus.ctx = "single";
  }
  _setupMergedCtx(sharedCtxs) {
    const mergedCtx = new MergedCtx_default(
      this.ctx.single,
      {
        ...sharedCtxs
      },
      this.valueCategories
    );
    this.ctx.merged = mergedCtx;
    this.typeBus.ctx = "merged";
  }
};
var Machine_default = Machine;

// src/core/Machine/index.ts
var createMachineApi = (machine) => {
  const hooks = machine.createHooks();
  return {
    setup: ({ ctx, actionHandlers, options }) => {
      machine.dynamicSetup(ctx, actionHandlers, options);
    },
    ...hooks
  };
};

// src/common/bus/CommandBus.ts
var CommandBus = class {
  constructor(commandMap) {
    this.commands = /* @__PURE__ */ new Map();
    this.commands = new Map(
      Object.entries(commandMap)
    );
  }
  execute(commandName, params) {
    const command = this.commands.get(commandName);
    if (command) {
      return command(params);
    }
  }
};

// src/core/Retomus/RetomusCommandBus.ts
var RetomusCommandBus = class extends CommandBus {
  constructor(retomusInstance) {
    super({
      getMachine: (id) => retomusInstance.getMachine(id),
      getCtx: (id) => retomusInstance.getCtx(id),
      getValueCategories: () => retomusInstance.getValueCategories()
    });
  }
};
var RetomusCommandBus_default = RetomusCommandBus;

// src/core/Retomus/RetomusEventBus.ts
var RetomusEventBus = class {
  constructor() {
    this.eventBus = new EventBus_default();
  }
  onMachineIsReady(handler) {
    this.eventBus.on("machineIsReady", handler);
    return () => this.eventBus.off("machineIsReady", handler);
  }
  onCtxIsReady(handler) {
    this.eventBus.on("ctxIsReady", handler);
    return () => this.eventBus.off("ctxIsReady", handler);
  }
  emitMachineIsReady(machine) {
    this.eventBus.emit("machineIsReady", { machine });
  }
  emitCtxIsReady(ctx) {
    this.eventBus.emit("ctxIsReady", { ctx });
  }
};
var RetomusEventBus_default = RetomusEventBus;

// src/core/Retomus/Retomus.ts
var import_react5 = require("react");
var defaultValueCategories = /* @__PURE__ */ new Map([
  [
    "state",
    {
      id: "state",
      use: (initialValue) => {
        const [state, setState] = (0, import_react5.useState)(initialValue);
        return [state, setState];
      },
      setterType: "state",
      valuePropName: null
    }
  ],
  [
    "ref",
    {
      id: "ref",
      use: (initialValue) => {
        const ref = (0, import_react5.useRef)(initialValue);
        return [
          ref,
          (value) => {
            ref.current = value;
          }
        ];
      },
      setterType: "ref",
      valuePropName: "current"
    }
  ]
]);
var defaultRetomusConfig = {
  valueCategories: defaultValueCategories
};
var createRetomus = (config = defaultRetomusConfig) => new Retomus(config);
var createValueCategories = (valueCategories) => {
  return new Map(
    valueCategories.map((valueCategory) => [valueCategory.id, valueCategory])
  );
};
var createRetomusConfig = (param = { valueCategories: [] }) => {
  return {
    valueCategories: createValueCategories(param.valueCategories)
  };
};
var Retomus = class {
  constructor(config) {
    this.machines = /* @__PURE__ */ new Map();
    this.ctxs = /* @__PURE__ */ new Map();
    this.valueCategories = defaultValueCategories;
    this.eventBus = new RetomusEventBus_default();
    this.commandBus = new RetomusCommandBus_default(this);
    if (config) {
      if (config.valueCategories) {
        config.valueCategories.forEach((valueCategory) => {
          this.registerValueCategory(valueCategory);
        });
      }
    }
  }
  getValueCategories() {
    return this.valueCategories;
  }
  registerValueCategory(ctxValueCategory) {
    this.valueCategories.set(ctxValueCategory.id, ctxValueCategory);
  }
  createMachine(config) {
    const machine = new Machine_default(
      config,
      this.eventBus,
      this.commandBus,
      this.valueCategories
    );
    this.registerMachine(config.id, machine);
    return createMachineApi(machine);
  }
  createCtx(id, values, options = {}) {
    const valuesMap = compileValuesRecordToMap(values, id);
    const ctx = new SharedCtx_default(id, valuesMap, this.valueCategories);
    this.registerCtx(id, ctx);
    return createCtxApi(ctx);
  }
  createCompositeAction(config) {
    const compositeAction = new CompositeAction_default(config, this.eventBus);
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
};

// src/utils/RetomusUtils.ts
var RetomusUtils = {
  createMachineConfig(config) {
    return config;
  },
  createCompositeActionConfig(config) {
    return config;
  }
  // createMachineConfig() {}
  // createStatusDefinitions() {}
  // createTransitionDefinitions() {}
  // createActionDefinitions() {}
  // createCtxDefinition() {}
  // createInitialStatusDefinition() {}
  // createPayloadDefinitions() {}
};
var RetomusUtils_default = RetomusUtils;

// src/index.ts
var { createMachineConfig, createCompositeActionConfig } = RetomusUtils_default;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  RetomusWrapper,
  createCompositeActionConfig,
  createMachineConfig,
  createRetomus,
  createRetomusConfig
});
//# sourceMappingURL=index.js.map