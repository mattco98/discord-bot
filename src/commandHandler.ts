import { Message } from "discord.js";
import { IssueCommand, ManCommand, PRCommand, QuickLinksCommand } from "./commands";
import Command from "./commands/commandInterface";
import { CommandParser } from "./models/commandParser";

export default class CommandHandler {
    private commands: Command[];

    private readonly prefix: string;

    private readonly production: boolean;

    constructor(prefix: string, production: boolean) {
        const commandClasses = [IssueCommand, ManCommand, PRCommand, QuickLinksCommand];

        this.commands = commandClasses.map(commandClass => new commandClass());
        this.prefix = prefix;
        this.production = production;
    }

    /** Executes user commands contained in a message if appropriate. */
    async handleMessage(message: Message): Promise<void> {
        if (message.author.bot || !this.isCommand(message)) {
            return;
        }

        if (!this.production) {
            await message.reply(
                `Buggie bot received '${this.echoMessage(message)}' from ${message.author.tag}`
            );
        }

        const commandParser = new CommandParser(message, this.prefix);

        if (commandParser.parsedCommandName == "help") {
            await message.reply(
                "Available commands:\n" + this.commands.map(cmd => cmd.help(this.prefix)).join("\n")
            );
            return;
        }

        const matchedCommand = this.commands.find(command =>
            command.matchesName(commandParser.parsedCommandName)
        );

        if (!matchedCommand) {
            await message.reply(`I don't recognize that command. Try **!help**.`);
        } else {
            await matchedCommand.run(commandParser).catch(error => {
                message.reply(`'${this.echoMessage(message)}' failed because of ${error}`);
            });
        }
    }

    /** Sends back the message content after removing the prefix. */
    echoMessage(message: Message): string {
        return message.content.replace(this.prefix, "").trim();
    }

    /** Determines whether or not a message is a user command. */
    private isCommand(message: Message): boolean {
        return message.content.startsWith(this.prefix);
    }
}
