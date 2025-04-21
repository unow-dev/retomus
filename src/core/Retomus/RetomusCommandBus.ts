import { CommandBus } from "../../common/bus/CommandBus";
import Retomus from "./Retomus";
import { RetomusCommandMap } from "./types";

class RetomusCommandBus extends CommandBus<RetomusCommandMap> {
   constructor(retomusInstance: Retomus) {
      super({
         getMachine: (id: string) => retomusInstance.getMachine(id),
         getCtx: (id: string) => retomusInstance.getCtx(id),
         getValueCategories: () => retomusInstance.getValueCategories(),
      });
   }
}

export default RetomusCommandBus;