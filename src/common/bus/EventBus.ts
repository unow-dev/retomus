class EventBus<Events extends Record<string, any>> {
   private listeners: {
      [K in keyof Events]?: Array<(payload: Events[K]) => void>;
   } = {};

   on<K extends keyof Events>(event: K, handler: (payload: Events[K]) => void) {
      if (!this.listeners[event]) {
         this.listeners[event] = [];
      }
      this.listeners[event]!.push(handler);
   }

   off<K extends keyof Events>(
      event: K,
      handler: (payload: Events[K]) => void,
   ) {
      this.listeners[event] = (this.listeners[event] ?? []).filter(
         h => h !== handler,
      );
   }

   emit<K extends keyof Events>(event: K, payload: Events[K]) {
      this.listeners[event]?.forEach(handler => handler(payload));
   }
}

export default EventBus;