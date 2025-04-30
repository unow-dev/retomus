import { CtxId, ValueCategories, ValueId } from '../../common/types/Value';
import {
   compileValueCategoriesRecordToMap,
   createValueId,
} from '../../common/utils';
import Ctx from './Ctx';
import { CtxMatter, IMachineCtx } from './types';
import React from 'react';

class MergedCtx implements IMachineCtx {
   ownCtx: Ctx;
   ctxs: Map<string, Ctx>;
   valueIdAndCtxIdMap: Map<ValueId, CtxId>;
   valueCategories: ValueCategories;

   constructor(
      ownCtx: Ctx,
      ctxs: Record<string, Ctx>,
      valueCategories: ValueCategories,
   ) {
      this.ownCtx = ownCtx;
      this.ctxs = new Map(Object.entries(ctxs));
      this.valueIdAndCtxIdMap = this._createValuesIdAndCtxIdMap();
      this.valueCategories = valueCategories;
      // try {
      //    this._subscribeAllForSharedCtx(valueCategories);
      // } catch (error) {
      //    console.error(error);
      // }
   }

   // _subscribeAllForSharedCtx(valueCategories) {
   //    for (const category of valueCategories) {
   //       if (category.setterType === 'state') {
   //          for (const [key, ctxId] of this.valueIdAndCtxIdMap[category.id]) {
   //             if (ctxId === this.ownCtx.id) {
   //                continue;
   //             }
   //             const ctx = this.ctxs.get(ctxId);
   //             if (ctx) {
   //                ctx.subscribe(key, value => this.setValue(key, value));
   //             }
   //          }
   //       }
   //    }
   // }

   getCtxIdByValueId(valueId: ValueId) {
      return this.valueIdAndCtxIdMap.get(valueId);
   }

   setValue(key: ValueId, value: any) {

      const ctxId = this.valueIdAndCtxIdMap.get(key);
      if (ctxId === this.ownCtx.id) {
         return this.ownCtx.setValue(key, value);
      }
      const ctx = this.ctxs.get(ctxId);
      if (ctx) {
         return ctx.setValue(key, value);
      }
   }

   getValue(key: ValueId): any {
      const ctxId = this.valueIdAndCtxIdMap.get(key);
      if (ctxId === this.ownCtx.id) {
         return this.ownCtx.getValue(key);
      }
      const ctx = this.ctxs.get(ctxId);
      if (ctx) {
         return ctx.getValue(key);
      }
   }

   // getRef(key: ValueId, category: Record<string, any>): any {
   //    const ctxId = this.valueIdAndCtxIdMap[category.id].get(key);
   //    if (ctxId === this.ownCtx) {
   //       return this.ownCtx.getRef(key, category);
   //    }
   //    const ctx = this.ctxs.get(ctxId);
   //    if (ctx) {
   //       return ctx.getRef(key, category);
   //    }
   // }

   dynamicSetup(ctxMatter: CtxMatter, options: any) {
      for (const ctx of this.ctxs.values()) {
         ctx.dynamicSetup(ctxMatter, options);
      }
      this.ownCtx.dynamicSetup(ctxMatter, options);
   }

   subscribe(
      key: ValueId,
      setState: React.Dispatch<React.SetStateAction<any>>,
   ) {
      const ctxId = this.valueIdAndCtxIdMap.get(key);
      if (ctxId === this.ownCtx.id) {
         return this.ownCtx.subscribe(key, setState);
      }
      const ctx = this.ctxs.get(ctxId);
      if (ctx) {
         return ctx.subscribe(key, setState);
      }
   }

   _createValueProxies(
      mergedCtx: MergedCtx,
      options: { readonly: boolean } = {
         readonly: false,
      },
   ) {
      const proxies = {};
      const getHandle = (target, prop, valueCategoryName) => {

         if (typeof prop === 'symbol') {
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
      const createProxies = (getHandle, setHandle) => {
         const proxies = {};
         mergedCtx.valueCategories.forEach((_value, valueCategoryName) => {
            proxies[valueCategoryName] = new Proxy<any>(
               {},
               {
                  get(target, prop: string) {
                     return getHandle(target, prop, valueCategoryName);
                  },
                  set(target, prop: string, value) {
                     return setHandle(target, prop, value, valueCategoryName);
                  },
               },
            );
         });

         return proxies;
      };

      return createProxies(
         getHandle,
         options.readonly ? setHandleReadOnly : setHandle,
      );
   }

   _createValueProxiesReadOnly(mergedCtx: MergedCtx) {
      const proxies = {};
      const getHandle = (target, prop, valueCategoryName) => {

         if (typeof prop === 'symbol') {
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
         proxies[valueCategoryName] = new Proxy<any>(
            {},
            {
               get(target, prop: string) {
                  return getHandle(target, prop, valueCategoryName);
               },
               set(_, prop: string, value) {
                  return setHandle();
               },
            },
         );
      });

      return proxies;
   }

   toRecord() {
      return this._createValueProxiesReadOnly(this);
   }

   toReactiveRecord(
      { readonly }: { readonly: boolean } = { readonly: false },
   ): Record<string, any> {
      return this._createValueProxies(this, { readonly });
   }

   private _createValuesIdAndCtxIdMap() {
      const valuesIdAndCtxIdMap = new Map();
      const ctxs = [...this.ctxs.values(), this.ownCtx];
      for (const ctx of ctxs) {
         ctx.values.forEach((valueObj, valueId) => {
            valuesIdAndCtxIdMap.set(valueId, ctx.id);
         });
      }
      return valuesIdAndCtxIdMap;
   }
}

export default MergedCtx;
