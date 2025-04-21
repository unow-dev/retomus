import { Value, ValueCategories, ValueId } from '../../common/types/Value';
import {
   compileValuesRecordToMap,
} from '../../common/utils';
import Ctx from './Ctx';
import { createSharedCtxValueHooks } from './hooks';

const createSharedCtx = (
   id: string,
   values: Record<string, Record<string, any>>,
   valueCategories: Map<string, any>,
) => {
   return new SharedCtx(
      id,
      compileValuesRecordToMap(values, id),
      valueCategories,
   );
};

class SharedCtx extends Ctx {
   flagBus: Record<string, boolean> = {
      isReady: false,
   };
   constructor(
      id: string,
      values: Map<ValueId, Value> = new Map(),
      valueCategories: ValueCategories,
   ) {
      super(id, values, valueCategories);
   }

   createHooks() {
      return createSharedCtxValueHooks(this, this.valueCategories);
   }
}

export default SharedCtx;
export { createSharedCtx };