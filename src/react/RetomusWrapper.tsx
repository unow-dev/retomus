import { createContext, useRef } from 'react';
import { CtxId, ValueId } from '../common/types/Value';

const RetomusWrapperContext = createContext<{
   refs;
}>({
   refs: new Map<CtxId, Map<ValueId, any>>(),
});

const RetomusWrapper = (props: any) => {
   const refs = useRef(new Map());
   return (
      <RetomusWrapperContext.Provider value={{ refs }}>
         {props.children}
      </RetomusWrapperContext.Provider>
   );
};

export default RetomusWrapper;
export { RetomusWrapperContext };
