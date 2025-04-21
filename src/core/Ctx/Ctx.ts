import {
   CtxId,
   ReactRefValueSetter,
   Value,
   ValueCategories,
   ValueId,
} from '../../common/types/Value';
import {
   compileValueCategoriesRecordToMap,
   compileValuesMapToRecord,
   compileValuesRecordToMap,
   createValueId,
} from '../../common/utils';
import { CtxMatter, IMachineCtx } from './types';
import React from 'react';

const createCtx = (
   id: CtxId,
   values: Record<string, Record<string, any>>,
   valueCategories: Record<string, any>,
) => {
   return new Ctx(
      id,
      compileValuesRecordToMap(values, id),
      compileValueCategoriesRecordToMap(valueCategories),
   );
};

class Ctx implements IMachineCtx {
   id: string;
   values: Map<ValueId, Value> = new Map();
   subscribers: Map<ValueId, Set<React.Dispatch<Value>>> = new Map();
   valueCategories: ValueCategories = new Map();

   constructor(
      id: string,
      values: Map<ValueId, Value> = new Map(),
      valueCategories: ValueCategories,
   ) {
      this.id = id;
      this.values = values;

      this.valueCategories = valueCategories;
      console.log('values in Ctx', values);
      this.values.forEach((_, valueId) => {
         this.subscribers.set(valueId, new Set());
      });
   }

   getCtxIdByValueId(valueId: ValueId) {
      return this.id;
   }

   dynamicSetup(
      ctxMatter: CtxMatter,
      options: {
         overwrite: boolean;
      } = { overwrite: true },
   ) {
      const needNotify: [ValueId, any][] = [];
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

   setValue(key: ValueId, value: any) {
      console.log('setValue in Ctx', key, value);
      this.values.set(key, value);
      this._notifySubscribers(key, value);
   }

   getValue(key: ValueId): any {
      return this.values.get(key);
   }

   getValueAndSetter(key: ValueId) {
      return this.values.get(key);
   }

   subscribe(key: ValueId, setValue: ReactRefValueSetter) {
      if (!this.subscribers.has(key)) {
         this.subscribers.set(key, new Set());
      }
      this.subscribers.get(key)?.add(setValue);
      console.log(
         'this.subscribers.get(key)',
         this.subscribers.get(key),
         key,
         setValue,
      );
      return () => {
         this.subscribers.get(key)?.delete(setValue);
      };
   }

   toRecord() {
      return compileValuesMapToRecord(this.values);
   }

   _createValueProxies(ctx: Ctx, options: { readonly: boolean } = { readonly: false }) {
      const proxies = {};
      ctx.valueCategories.forEach((_value, valueCategoryName) => {
         proxies[valueCategoryName] = new Proxy<any>(
            {},
            {
               get(target, prop: string) {
                  console.log('prop', prop);
                  if (typeof prop === 'symbol') {
                     return target[prop];
                  }
                  const valueId = createValueId(prop, valueCategoryName);
                  if (ctx.values.has(valueId)) {
                     return ctx.getValue(valueId);
                  }
               },
               set(target, prop: string, value) {
                  if (options.readonly) {
                     return true;
                  }
                  if (typeof prop === 'symbol') {
                     return true;
                  }
                  const valueId = createValueId(prop, valueCategoryName);
                  if (ctx.values.has(valueId)) {
                     ctx.setValue(valueId, value);
                     return true;
                  }
                  return true;
               },
            },
         );
      });
      console.log('proxies', proxies);
      return proxies;
   }

   toReactiveRecord(options = { readonly: false }) {
      return this._createValueProxies(this, options);
   }

   private _notifySubscribers(valueId: ValueId, value: any) {
      if (!this.subscribers.get(valueId)) {
         return;
      }
      this.subscribers.get(valueId)?.forEach(setState => {
         setState(value);
      });
      console.log(
         'this.subscribers.get(valueId) in _notifySubscribers',
         this.subscribers.get(valueId),
         value,
         valueId,
         `ctxId ${this.id}`,
      );
   }
}

export default Ctx;
export { createCtx };
