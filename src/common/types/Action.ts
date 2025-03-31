type ActionHandler = ({ ctx, payload, done, error }) => Promise<any>;
type ActionHandlers = Map<string, ActionHandler>;

export { ActionHandler, ActionHandlers };