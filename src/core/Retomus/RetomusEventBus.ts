import EventBus from "../../common/bus/EventBus";
import { RetomusEventMap } from "./types";

class RetomusEventBus {
   eventBus: EventBus<RetomusEventMap> = new EventBus();
   constructor() {}
   onMachineIsReady(handler: ({ machine }: { machine: any }) => void) {

      this.eventBus.on('machineIsReady', handler);
      return () => this.eventBus.off('machineIsReady', handler);
   }
   onCtxIsReady(handler: ({ ctx }: { ctx: string }) => void) {
      this.eventBus.on('ctxIsReady', handler);
      return () => this.eventBus.off('ctxIsReady', handler);
   }
   emitMachineIsReady(machine: any) {

      this.eventBus.emit('machineIsReady', { machine });
   }
   emitCtxIsReady(ctx: any) {
      this.eventBus.emit('ctxIsReady', { ctx });
   }
}

export default RetomusEventBus;