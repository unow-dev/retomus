import { IMachineCtx } from './types';
import React from 'react';
declare class Ctx implements IMachineCtx {
    id: string;
    states: Map<string, any>;
    refs: Record<string, any>;
    stateSubscribers: Map<string, Set<React.Dispatch<React.SetStateAction<any>>>>;
    constructor(id: string, states?: Record<string, any>, refs?: Record<string, any>);
    dynamicSetup(ctxMatter: Record<'states' | 'refs', Record<string, any>>, options: {
        overwrite: boolean;
    }): void;
    setValue(key: string, value: any, category: 'states' | 'refs'): void;
    getValue(key: string, category: 'states' | 'refs'): any;
    subscribeState(key: string, setState: React.Dispatch<React.SetStateAction<any>>): () => void;
    toRecord(): {
        states: {
            [k: string]: any;
        };
        refs: Record<string, any>;
    };
    toReactiveRecord(): {
        states: {};
        refs: Record<string, any>;
    };
    private _setState;
    private _notifyStateSubscribers;
}
export default Ctx;
