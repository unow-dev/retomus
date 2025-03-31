import Ctx from './Ctx';
import { IMachineCtx } from './types';
import React from 'react';
declare class MergedCtx implements IMachineCtx {
    ownCtx: Ctx;
    ctxs: Map<string, Ctx>;
    valueKeyAndCtxIdMap: Record<'states' | 'refs', Map<string, any>>;
    constructor(ownCtx: Ctx, ctxs: Record<string, Ctx>);
    _subscribeStateAllToAllSharedCtx(): void;
    setValue(key: string, value: any, category: 'states' | 'refs'): void;
    getValue(key: string, category: 'states' | 'refs'): any;
    dynamicSetup(ctxMatter: any, options: any): void;
    subscribeState(key: string, setState: React.Dispatch<React.SetStateAction<any>>): () => void;
    toRecord(): {
        states: {};
        refs: {
            [x: string]: any;
        };
    };
    toReactiveRecord(): {
        states: {};
        refs: {
            [x: string]: any;
        };
    };
    private _getRefsAll;
    private _createMergedValuesKeyCtxIdMap;
}
export default MergedCtx;
