import React from 'react';
import { ActionHandlers } from '../../common/types/Action';
import { Ctx, MergedCtx } from '../Ctx';
import { RetomusCommandBus, RetomusEventBus } from '../Retomus';
import { DEFAULT_STATUS } from './constants';
import { MachineHooks } from './types';
declare class Machine {
    id: string;
    config: any;
    status: string | typeof DEFAULT_STATUS;
    statusSubscribers: Set<React.Dispatch<React.SetStateAction<any>>>;
    ctx: {
        single: Ctx | null;
        merged: MergedCtx | null;
    };
    actionHandlers: ActionHandlers;
    sharedCtxIds: string[];
    typeBus: {
        ctx: 'single' | 'merged';
    };
    stateBus: {
        isDoneSetupStatus: boolean;
        isDoneStaticCtxSetup: boolean;
        isDoneDynamicCtxSetup: boolean;
    };
    flagBus: {
        isReady: boolean;
        isReadyCtx: boolean;
        isReadyActions: boolean;
    };
    flagSubscribers: Record<string, Set<React.Dispatch<React.SetStateAction<any>>>>;
    retomusEventBus: RetomusEventBus;
    retomusCommandBus: RetomusCommandBus;
    constructor(config: any, retomusEventBus: RetomusEventBus, retomusCommandBus: RetomusCommandBus);
    setValue(key: string, value: any, category: 'states' | 'refs'): void;
    getValue(key: string, category: 'states' | 'refs'): any;
    dynamicSetup(ctx: Record<'states' | 'refs', Record<string, any>>, actionHandlers: ActionHandlers, options?: {
        ctx: {
            overwrite: boolean;
        };
        actionHandlers: {};
    }): void;
    subscribeStatus(setStatus: React.Dispatch<React.SetStateAction<any>>): () => void;
    subscribeState(key: string, setState: React.Dispatch<React.SetStateAction<any>>): () => void;
    createHooks(): MachineHooks;
    _setFlag(key: string, value: boolean): void;
    _updateIsReady(): void;
    _updateIsReadyCtx(value: boolean): void;
    _updateIsReadyActions(value: boolean): void;
    _notifyFlagSubscribers(key: string): void;
    _subscribeFlag(key: string, callback: React.Dispatch<React.SetStateAction<any>> | ((value: boolean) => void)): () => void;
    _staticSetupActionHandlers(actionHandlerDefinitions: any): void;
    _dynamicSetupActionHandlers(actionHandlerDefinitions: ActionHandlers, options: any): void;
    _executeAction(action: string, payload: any): Promise<any>;
    _processActionHandler(handler: any, payload: any): Promise<any>;
    _validateAction(action: string): void;
    _processTransitionError(error: any, action: string): void;
    _processTransitionSuccess(returnValues: any, action: string): any;
    _staticSetupStatus(initialStatusDefinition: any): void;
    _dynamicSetupStatus(initialStatusDefinition: any): void;
    _notifyStatusSubscribers(): void;
    _transitionStatus(status: string): void;
    _staticSetupCtx(ctxDefinition: any): void;
    _setupSingleCtx(ctxDefinition: any): void;
    _setupMergedCtx(sharedCtxs: Record<string, Ctx>): void;
}
export default Machine;
