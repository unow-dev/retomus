class CommandBus<T> implements ICommandBus<T> {
   commands: Map<keyof T, CommandHandler> = new Map<keyof T, CommandHandler>();

   constructor(commandMap: Record<keyof T, CommandHandler>) {

      this.commands = new Map<keyof T, CommandHandler>(
         Object.entries(commandMap) as any,
      );
   }

   execute(commandName: keyof T, params: any) {
      const command = this.commands.get(commandName);


      if (command) {
         return command(params);
      }
   }
}

interface ICommandBus<T = Record<string, any>> {
   execute: (commandName: keyof T, params: any) => void;
}
type CommandHandler = (params) => void | any;

export { CommandBus };