import { Ctx } from '../../core/Ctx';
import {
   CategoryId,
   CtxId,
   ValueCategories,
   ValueCategory,
   ValueCategoryName,
   ValueId,
   ValueName,
} from '../types/Value';

const withUpperCaseFirstLetter = str =>
   str.charAt(0).toUpperCase() + str.slice(1);

const createValueId = (valueName: ValueName, categoryId: CategoryId): ValueId =>
   `${categoryId}-${valueName}`;

const compileValuesRecordToMap = (
   record: Record<CategoryId, Record<ValueName, any>>,
   ctxId,
): Map<ValueId, any> => {
   const map = new Map<ValueId, any>();

   for (const [categoryId, values] of Object.entries(record)) {
      for (const [valueName, value] of Object.entries(values)) {
         map.set(createValueId(valueName, categoryId), value);
      }
   }

   return map;
};

const compileValuesMapToRecord = (
   map: Map<ValueId, any>,
): Record<ValueId, any> => Object.fromEntries(map);

const compileValueCategoriesRecordToMap = (
   record: Record<ValueCategoryName, ValueCategory>,
): ValueCategories => new Map(Object.entries(record));

export {
   withUpperCaseFirstLetter,
   createValueId,
   compileValuesRecordToMap,
   compileValuesMapToRecord,
   compileValueCategoriesRecordToMap,
};
