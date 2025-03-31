import { CompositeActionConfig } from "../core/CompositeAction/types";
import { MachineConfig } from "../core/Machine/types";

const RetomusUtils = {
   createMachineConfig(config: MachineConfig): MachineConfig {
      return config;
   },
   createCompositeActionConfig(config): CompositeActionConfig {
      return config;
   }

   // createMachineConfig() {}

   // createStatusDefinitions() {}

   // createTransitionDefinitions() {}

   // createActionDefinitions() {}

   // createCtxDefinition() {}

   // createInitialStatusDefinition() {}

   // createPayloadDefinitions() {}
}

export default RetomusUtils;