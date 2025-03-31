type ActionHandler = ({ ctx, payload, done, error }: {
    ctx: any;
    payload: any;
    done: any;
    error: any;
}) => Promise<any>;
type ActionHandlers = Map<string, ActionHandler>;
export { ActionHandler, ActionHandlers };
