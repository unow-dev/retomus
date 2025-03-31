import { CompositeActionConfig } from "../core/CompositeAction/types";
import { MachineConfig } from "../core/Machine/types";
declare const RetomusUtils: {
    createMachineConfig(config: MachineConfig): MachineConfig;
    createCompositeActionConfig(config: any): CompositeActionConfig;
};
export default RetomusUtils;
