const path = require("path");
const onlyAlphabetic = RegExp.prototype.test.bind(/^[a-zA-Z0-9]+$/);

class Command {
    constructor(name, handler, subcommands) {
        if (typeof name !== "string") throw new TypeError("Command name must be a string");
        if (!onlyAlphabetic(name)) throw new Error(`Invalid command name: ${name}`);
        if (name.length < 1) throw new Error("Command name must be at least 1 character long");

        if (typeof handler !== "function") throw new TypeError("Command handler must be a function");
        if (subcommands) {
            if (subcommands instanceof Command) {
                this.subcommands.add(subcommands);
            } else if (Array.isArray(subcommands)) {
                for (const subcommand of subcommands) {
                    this.subcommands.add(subcommand);
                }
            } else {
                throw new TypeError("Subcommands must be an instance or an array of Command");
            }
        }

        this.name = name;
        this.handler = handler;
    }

    name;
    subcommands = new Command.Collection();
    handler;

    run(...args) {
        const subcommand = this.subcommands.test(args[0]);
        if (subcommand) {
            subcommand.run(...args.slice(1));
        } else {
            this.handler(...args);
        }
    }

    static Collection = class CommandCollection extends Set {
        constructor() {
            super();
        }

        add(command) {
            if (command instanceof Command) {
                if (this.test(command.name)) throw new Error(`Command ${command.name} already exists`);
                super.add(command);
            } else {
                throw new TypeError("CommandCollection only accepts Command instances");
            }
        }

        test(name) {
            for (const command of this) {
                if (command.name === name) return command;
            }
            return null;
        }
    }

    static getFlags(args) {}
}

const commands = new Command.Collection();

const commandList = [
    new Command("test", (...args) => {
        console.log(args.length);
    }),
    new Command("sub", () => {}, [
        new Command("1", () => console.log("Subcommand 1")),
        new Command("2", () => console.log("Subcommand 2")),
        new Command("3", () => console.log("Subcommand 3")),
        new Command("4", () => console.log("Subcommand 4")),
    ])
];

for (const command of commandList) {
    commands.add(command);
}

process.stdin.on("data", data => {
    data = data.toString("utf-8").replace("\r\n", "");

    const split = data.split(" ");
    const commandName = split[0];
    const args = split.slice(1);

    const command = commands.test(commandName);
    if (command) {
        command.run(...args);
    } else {
        console.log(`Command ${commandName} not found`);
    }
});