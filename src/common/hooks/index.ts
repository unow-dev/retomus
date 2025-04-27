import { useContext, useEffect, useRef } from 'react';
import { createValueId, withUpperCaseFirstLetter } from '../utils';
import { RetomusWrapperContext } from '../../react/RetomusWrapper';
import { Ctx } from '../../core/Ctx';
import { Machine } from '../../core/Machine';
import { ValueCategories, ValueCategory } from '../types/Value';

const valueHook =
  (hookProvider: Ctx | Machine, category: ValueCategory) => key => {
    const valueId = createValueId(key, category.id);
    const { refs } = useContext(RetomusWrapperContext);
    const ctxIdOfValueId = hookProvider.getCtxIdByValueId(valueId);

    // setterType state: => value, ref: => ref
    // stateの場合、setStateを購読者としてセット
    // refの場合、(value)=>ref.current = value を購読者としてセット
    const [value, setValue] = category.use(hookProvider.getValue(valueId));
    const unsubscribeRef = useRef(null);

    let target = refs.current; // target-map
    switch (category.setterType) {
      case 'state':
        hookProvider.setValue(valueId, value);
        unsubscribeRef.current = hookProvider.subscribe(valueId, setValue);
        break;
      case 'ref':
        if (!target.has(ctxIdOfValueId)) {
          // add map to refs for ctx
          target.set(ctxIdOfValueId, new Map());
        }
        target = target.get(ctxIdOfValueId);
        if (!target.has(category.id)) {
          target.set(category.id, new Map());
        }
        target = target.get(category.id);
        if (target.has(valueId) && target.get(valueId) !== value) {
          // existed ref in react context
          // dispose a new ref
          setValue(null);
          break;
        } else {
          // set new ref in react context
          target.set(valueId, value);
          // set in machine, and subscribe in machine
          hookProvider.setValue(valueId, value[category.valuePropName]);
          unsubscribeRef.current = hookProvider.subscribe(valueId, setValue);
        }
        break;
      default:
        console.error(
          `Invalid setterType: ${category.setterType} for category: ${category.id} in machine: ${hookProvider.id}`,
        );
    }
    useEffect(() => {
      return () => {
        if (unsubscribeRef.current) {
          unsubscribeRef.current();
        }
      };
    }, []);

    return category.setterType === 'state' ? value : target.get(valueId);
  };

const createValueHooks = (
  hookProvider: Ctx | Machine,
  valueCategories: ValueCategories,
): Record<string, any> => {
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
