import { CommandBus } from "../../common/bus/CommandBus";
import Retomus from "./Retomus";
import { RetomusCommandMap } from "./types";
declare class RetomusCommandBus extends CommandBus<RetomusCommandMap> {
    constructor(retomusInstance: Retomus);
}
export default RetomusCommandBus;
