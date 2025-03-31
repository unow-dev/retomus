import EventBus from "../../common/bus/EventBus";
import { RetomusEventMap } from "./types";
declare class RetomusEventBus {
    eventBus: EventBus<RetomusEventMap>;
    constructor();
    onMachineIsReady(handler: ({ machine }: {
        machine: any;
    }) => void): () => void;
    onCtxIsReady(handler: ({ ctx }: {
        ctx: string;
    }) => void): () => void;
    emitMachineIsReady(machine: any): void;
    emitCtxIsReady(ctx: any): void;
}
export default RetomusEventBus;
