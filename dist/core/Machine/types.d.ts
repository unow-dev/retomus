import { ActionHandler } from "../../common/types/Action";
type MachineConfig = {
    id: string;
    statusDefinitions: string[];
    actionDefinitions: string[];
    actionHandlerDefinitions: Record<string, ActionHandler>;
    transitionDefinitions: Record<string, Record<string, string | string[]>>;
    payloadDefinitions: Record<string, any>;
    transitionSelectorDefinitions: Record<string, () => string>;
    ctxDefinition: {
        states?: Record<string, any>;
        refs?: Record<string, any>;
    };
    initialStatusDefinition: {
        status: string | ((ctx: Record<string, any>) => string);
        options: {
            staticSetup: boolean;
            dynamicSetup: boolean;
        };
    };
    options: {
        onInvalidAction?: (action: string, status: string) => void;
        dynamicSetupCtx?: boolean;
        dynamicSetupActions?: boolean;
        sharedCtxIds?: string[];
    };
};
type MachineApi = {
    setup: any;
    useStatus: any;
    useAction: any;
    useState: any;
    useRef: any;
    useFlag: any;
};
type MachineHooks = {
    useStatus: any;
    useAction: any;
    useState: any;
    useRef: any;
    useFlag: any;
};
export { MachineConfig, MachineApi, MachineHooks };
