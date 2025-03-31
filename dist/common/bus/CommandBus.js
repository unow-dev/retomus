class CommandBus {
    constructor(commandMap) {
        this.commands = new Map();
        this.commands = new Map(Object.entries(commandMap));
    }
    execute(commandName, params) {
        const command = this.commands.get(commandName);
        if (command) {
            return command(params);
        }
    }
}
export { CommandBus };
