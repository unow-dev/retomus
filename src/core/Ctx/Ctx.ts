import { IMachineCtx } from './types';
import React from 'react';

class Ctx implements IMachineCtx {
   id: string;
   states: Map<string, any>;
   refs: Record<string, any>;

   stateSubscribers: Map<
      string,
      Set<React.Dispatch<React.SetStateAction<any>>>
   > = new Map();

   constructor(
      id: string,
      states: Record<string, any> = {},
      refs: Record<string, any> = {},
   ) {
      this.id = id;
      this.states = new Map(Object.entries(states));
      this.refs = refs;
   }

   dynamicSetup(
      ctxMatter: Record<'states' | 'refs', Record<string, any>>,
      options: {
         overwrite: boolean;
      },
   ) {
      const stateEntries = Object.entries(ctxMatter?.states ?? {});
      if (options?.overwrite) {
         for (const [key, value] of stateEntries) {
            this.states.set(key, value);
         }
         this.refs = ctxMatter?.refs ?? {};
      } else {
         for (const [key, value] of stateEntries) {
            this.states.set(key, value);
         }
      }
      for (const [key, value] of this.states) {
         this._notifyStateSubscribers(key, value);
      }
   }

   setValue(key: string, value: any, category: 'states' | 'refs') {
      if (category === 'states') {
         this._setState(key, value);
      } else {
         this[category][key] = value;
      }
   }

   getValue(key: string, category: 'states' | 'refs'): any {
      if (category === 'states') {
         return this.states.get(key);
      } else {
         return this[category][key];
      }
   }

   subscribeState(
      key: string,
      setState: React.Dispatch<React.SetStateAction<any>>,
   ) {
      if (!this.stateSubscribers.has(key)) {
         this.stateSubscribers.set(key, new Set());
      }
      this.stateSubscribers.get(key)?.add(setState);
      return () => {
         this.stateSubscribers.get(key)?.delete(setState);
      };
   }

   toRecord() {
      return {
         states: Object.fromEntries(this.states),
         refs: this.refs,
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
                  ctx._setState(prop, value);
                  return true;
               },
            },
         );
      return {
         states: getStateProxy(this),
         refs: this.refs,
      };
   }

   private _setState(key: string, value: any) {
      if (this.states.get(key) !== value) {
         this.states.set(key, value);
         this._notifyStateSubscribers(key, value);
      }
   }

   private _notifyStateSubscribers(key: string, value: any) {
      this.stateSubscribers.get(key)?.forEach(setState => {
         setState(value);
      });
   }
}

export default Ctx;
