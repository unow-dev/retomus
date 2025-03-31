import Ctx from './Ctx';
import { IMachineCtx } from './types';
import React from 'react';

class MergedCtx implements IMachineCtx {
   ownCtx: Ctx;
   ctxs: Map<string, Ctx>;
   valueKeyAndCtxIdMap: Record<'states' | 'refs', Map<string, any>>;

   constructor(ownCtx: Ctx, ctxs: Record<string, Ctx>) {
      this.ownCtx = ownCtx;
      this.ctxs = new Map(Object.entries(ctxs));
      this.valueKeyAndCtxIdMap = this._createMergedValuesKeyCtxIdMap();
      try {
         this._subscribeStateAllToAllSharedCtx();
      } catch (error) {
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
            ctx.subscribeState(key, value =>
               this.setValue(key, value, 'states'),
            );
         }
      }
   }

   setValue(key: string, value: any, category: 'states' | 'refs') {
      const ctxId = this.valueKeyAndCtxIdMap[category].get(key);
      if (ctxId === this.ownCtx) {
         return this.ownCtx.setValue(key, value, category);
      }
      const ctx = this.ctxs.get(ctxId);
      if (ctx) {
         return ctx.setValue(key, value, category);
      }
   }

   getValue(key: string, category: 'states' | 'refs'): any {
      const ctxId = this.valueKeyAndCtxIdMap[category].get(key);
      if (ctxId === this.ownCtx) {
         return this.ownCtx.getValue(key, category);
      }
      const ctx = this.ctxs.get(ctxId);
      if (ctx) {
         return ctx.getValue(key, category);
      }
   }

   dynamicSetup(ctxMatter: any, options: any) {
      for (const ctx of this.ctxs.values()) {
         ctx.dynamicSetup(ctxMatter, options);
      }
      this.ownCtx.dynamicSetup(ctxMatter, options);
   }

   subscribeState(
      key: string,
      setState: React.Dispatch<React.SetStateAction<any>>,
   ) {
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
      const getStateProxy = ctx =>
         new Proxy(
            {},
            {
               get(_, prop: string) {
                  return ctx.getValue(prop, 'states');
               },
               set(_, prop: string, value) {
                  return true;
               },
            },
         );
      return {
         states: getStateProxy(this),
         refs: this._getRefsAll(),
      };
   }

   toReactiveRecord() {
      const getStateProxy = ctx =>
         new Proxy(
            {},
            {
               get(_, prop: string) {
                  return ctx.getValue(prop, 'states');
               },
               set(_, prop: string, value) {
                  ctx.setValue(prop, value, 'states');
                  return true;
               },
            },
         );

      return {
         states: getStateProxy(this),
         refs: this._getRefsAll(),
      };
   }

   private _getRefsAll() {
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

   private _createMergedValuesKeyCtxIdMap() {
      const states = new Map();
      const refs = new Map();
      this.ctxs.forEach((ctx, ctxId) => {
         if (ctx?.states?.size > 0) {
            ctx.states.forEach((value, key) => {
               if (states.has(key)) {
                  throw new Error(`Duplicate state key: ${key}`);
               }
               states.set(key, ctxId);
            });
         }
         if (ctx?.refs?.size > 0) {
            ctx.refs.forEach((value, key) => {
               if (states.has(key)) {
                  throw new Error(`Duplicate state key: ${key}`);
               }
               refs.set(key, ctxId);
            });
         }
      });
      const ownCtx = this.ownCtx;
      if (ownCtx?.states?.size > 0) {
         ownCtx.states.forEach((value, key) => {
            if (states.has(key)) {
               throw new Error(`Duplicate state key: ${key}`);
            }
            states.set(key, this.ownCtx);
         });
      }
      if (ownCtx?.refs?.size > 0) {
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
