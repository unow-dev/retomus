declare class CommandBus<T> implements ICommandBus<T> {
    commands: Map<keyof T, CommandHandler>;
    constructor(commandMap: Record<keyof T, CommandHandler>);
    execute(commandName: keyof T, params: any): any;
}
interface ICommandBus<T = Record<string, any>> {
    execute: (commandName: keyof T, params: any) => void;
}
type CommandHandler = (params: any) => void | any;
export { CommandBus };
