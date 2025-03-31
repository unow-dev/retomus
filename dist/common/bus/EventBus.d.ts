declare class EventBus<Events extends Record<string, any>> {
    private listeners;
    on<K extends keyof Events>(event: K, handler: (payload: Events[K]) => void): void;
    off<K extends keyof Events>(event: K, handler: (payload: Events[K]) => void): void;
    emit<K extends keyof Events>(event: K, payload: Events[K]): void;
}
export default EventBus;
