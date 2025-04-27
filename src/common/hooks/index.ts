import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createValueId, withUpperCaseFirstLetter } from '../utils';
import { RetomusWrapperContext } from '../../react/RetomusWrapper';
import { Ctx } from '../../core/Ctx';
import { Machine } from '../../core/Machine';
import { Value, ValueCategories, ValueCategory } from '../types/Value';

const valueHook =
  (hookProvider: Ctx | Machine, category: ValueCategory) => key => {
    console.log('key', key);
    console.log('hookProvider', hookProvider);
    console.log('category', category);
    console.log('category.id', category.id);
    console.log('category.use', category.use);
    console.log('category.setterType', category.setterType);
    const valueId = createValueId(key, category.id);
    console.log('valueId', valueId);
    const { refs } = useContext(RetomusWrapperContext);
    console.log('refs that in RetomusWrapperContext', refs);
    const ctxIdOfValueId = hookProvider.getCtxIdByValueId(valueId);

    // setterType state: => value, ref: => ref
    // stateの場合、setStateを購読者としてセット
    // refの場合、(value)=>ref.current = value を購読者としてセット
    const [value, setValue] = category.use(hookProvider.getValue(valueId));
    const unsubscribeRef = useRef(null);
    const initializedRef = useRef(false);

    useEffect(() => {
      if (category.setterType === 'state') {
        hookProvider.setValue(valueId, value);
        unsubscribeRef.current = hookProvider.subscribe(valueId, setValue);
      }
    }, [setValue, valueId, value]);

    const target = useRef(refs.current); // target-map
    console.log('target at start of useEffect', target);
    useEffect(() => {
      if (category.setterType === 'ref' && !initializedRef.current) {
        if (!target.current.has(ctxIdOfValueId)) {
          // add map to refs for ctx
          target.current.set(ctxIdOfValueId, new Map());
        }
        target.current = target.current.get(ctxIdOfValueId);
        if (!target.current.has(category.id)) {
          target.current.set(category.id, new Map());
        }
        target.current = target.current.get(category.id);
        if (target.current.has(valueId)) {
          // existed ref in react context
          // dispose a new ref
          // setValue(target.get(valueId)[category.valuePropName]);
          // unsubscribeRef.current = hookProvider.subscribe(valueId, setValue);
          setValue(null);
          initializedRef.current = true;
        } else {
          // set new ref in react context
          console.log('target before set', target.current);
          target.current.set(valueId, value);
          // set in machine, and subscribe in machine
          hookProvider.setValue(valueId, value[category.valuePropName]);
          unsubscribeRef.current = hookProvider.subscribe(valueId, setValue);
          initializedRef.current = true;
        }
      }
    }, []);

    useEffect(() => {
      if (category.setterType === 'ref') {
        unsubscribeRef.current = hookProvider.subscribe(valueId, setValue);
      }
    }, [setValue]);

    useEffect(() => {
      return () => {
        if (category.setterType === 'state') {
          if (unsubscribeRef.current) {
            unsubscribeRef.current();
          }
        }
        // todo: fixed this bug. 他のコンポーネントで同じvalueIdを使っていた場合、valueIdを削除しないようにする。
        // RetomusWrapperContextでvalueの購読者を管理し、ここではvalueの購読者を削除する。
        // 削除後、購読者が0になったら、valueIdを削除し、ctxのsubscribersからも削除する。
        // if (category.setterType === 'ref') {
        //   refs.current?.get(ctxIdOfValueId)?.get(category.id)?.delete(valueId);
        // if (unsubscribeRef.current) {
        //   unsubscribeRef.current();
        // }
        // }
      };
    }, []);

    console.log('target at end', target.current);

    return category.setterType === 'state'
      ? value
      : refs.current?.get(ctxIdOfValueId)?.get(category.id)?.get(valueId) ||
          value;
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
