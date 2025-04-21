import { ActionHandler } from '../../common/types/Action';
import { CtxMatter } from '../Ctx/types';

type MachineConfig = {
   id: string;
   status: string[];
   actions: string[];
   actionHandlers: Record<string, ActionHandler>;
   transitions: Record<string, Record<string, string | string[]>>;
   payloads?: Record<string, any>;
   router?: Record<string, (ctx: Record<string, any>) => string>;
   ctx: CtxMatter;
   initialStatus: {
      status: string | ((ctx: Record<string, any>) => string);
      options?: { staticSetup?: boolean; dynamicSetup?: boolean };
   };
   options?: {
      onInvalidAction?: (action: string, status: string) => void;
      dynamicSetupCtx?: boolean;
      dynamicSetupActions?: boolean;
      sharedCtxIds?: string[];
   };
};

type MachineApi = Record<string, any>;

type MachineHooks = Record<string, any>;

export { MachineConfig, MachineApi, MachineHooks };
