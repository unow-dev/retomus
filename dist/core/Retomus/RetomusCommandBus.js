import { CommandBus } from "../../common/bus/CommandBus";
class RetomusCommandBus extends CommandBus {
    constructor(retomusInstance) {
        super({
            getMachine: (id) => retomusInstance.getMachine(id),
            getCtx: (id) => retomusInstance.getCtx(id),
        });
    }
}
export default RetomusCommandBus;
