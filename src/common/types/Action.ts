type ActionHandler = ({ ctx, payload, done, error }) => Promise<any> | void;
type ActionHandlers = Map<string, ActionHandler>;

export { ActionHandler, ActionHandlers };
