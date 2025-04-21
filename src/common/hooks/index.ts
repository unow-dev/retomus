import { useContext, useEffect, useMemo, useState } from 'react';
import { createValueId, withUpperCaseFirstLetter } from '../utils';
import { RetomusWrapperContext } from '../../react/RetomusWrapper';
import { Ctx } from '../../core/Ctx';
import { Machine } from '../../core/Machine';
import { Value, ValueCategories, ValueCategory } from '../types/Value';

const valueHook =
   (hookProvider: Ctx | Machine, category: ValueCategory) => key => {
      const valueId = createValueId(key, category.id);
      const { refs } = useContext(RetomusWrapperContext);
      console.log('refs in valueHook', refs);
      // setterType state: => value, ref: => ref
      // stateの場合、setStateを購読者としてセット
      // refの場合、(value)=>ref.current = value を購読者としてセット
      const [value, setValue] = category.use(hookProvider.getValue(valueId));
      console.log(
         'value and setValue in valueHook',
         `value: ${value}, setValue: ${setValue}, valueId: ${valueId}, category: ${category.id}, hookProvider: ${hookProvider.id}`,
      );

      useEffect(() => {
         let target = refs.current; // target-map
         const unsubscribe = (() => {
            switch (category.setterType) {
               case 'state':
                  hookProvider.setValue(valueId, value);
                  return hookProvider.subscribe(valueId, setValue);
               case 'ref':
                  const ctxIdOfValueId =
                     hookProvider.getCtxIdByValueId(valueId);
                  if (!target.has(ctxIdOfValueId)) {
                     // add map to refs for ctx
                     target.set(ctxIdOfValueId, new Map());
                     target = target.get(ctxIdOfValueId);
                  }
                  if (!target.has(category.id)) {
                     target.set(category.id, new Map());
                     target = target.get(category.id);
                  }
                  if (target.has(valueId)) {
                     // existed ref in react context
                     // dispose a new ref
                     setValue(null);
                     return null;
                  }
                  // set new ref in react context
                  target.set(valueId, value);
                  // set in machine, and subscribe in machine
                  hookProvider.setValue(valueId, value);
                  return hookProvider.subscribe(valueId, setValue);
               default:
                  console.error(
                     `Invalid setterType: ${category.setterType} for category: ${category.id} in machine: ${hookProvider.id}`,
                  );
                  return null;
            }
         })();
         return () => {
            if (unsubscribe) {
               unsubscribe();
            }
         };
      }, []);
      return category.setterType === 'state'
         ? value
         : refs.current.get(category.id)?.get(valueId) || value;
   };

const createValueHooks = (
   hookProvider: Ctx | Machine,
   valueCategories: ValueCategories,
): Record<string, any> => {
   console.log('categories in createValueHooks', valueCategories);
   const hooks = {};
   valueCategories.forEach(category => {
      hooks[`use${withUpperCaseFirstLetter(category.id)}`] = valueHook(
         hookProvider,
         category,
      );
   });
   return hooks;
};

export { createValueHooks };
