type ValueName = string;
type CategoryId = string;
type CtxId = string;
type ValueCategoryName = string;
type ValueId = `${CategoryId}-${ValueName}`;
type Value = any;
type ReactRefValueSetter = (value: any) => void;

interface ValueCategory {
   id: ValueCategoryName;
   use: (initialValue: any) => [any, (value: any) => void];
   setterType: 'state' | 'ref';
   valuePropName?: string;
}

type ValueCategories = Map<ValueCategoryName, ValueCategory>;

export {
   ValueName,
   ValueId,
   CategoryId,
   CtxId,
   ValueCategoryName,
   ValueCategory,
   ReactRefValueSetter,
   ValueCategories,
   Value,
};

// type CtxValueCategories = Map<string, CtxValueRef | CtxState>;
