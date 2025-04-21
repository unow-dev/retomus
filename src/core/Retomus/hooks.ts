import { useCallback, useContext, useMemo } from 'react';
import { RetomusWrapperContext } from '../../react/RetomusWrapper';

// const useRetomusRef = (key: string, ctxId: string, categoryId: string) => {
//    const { refs } = useContext(RetomusWrapperContext);

//    const ref = useMemo(
//       () => refs.get(key, ctxId, categoryId),
//       [refs, key, ctxId, categoryId],
//    );
//    const update = useCallback(
//       value => refs.update(key, value, ctxId, categoryId),
//       [refs, key, ctxId, categoryId],
//    );

//    return [ref, update];
// };

// export { useRetomusRef };
