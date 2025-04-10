const { Client } = require('discord.js');
const Service = require('./service');
const { createInterface } = require('node:readline');

const app = new Service();
const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});

async function discord() {
    const client = new Client({ intents: ["Guilds", "GuildMessages", "DirectMessages", "MessageContent"] });

    const prefix = '::';
    let currentCommand = '';

    client.on('messageCreate', async (message) => {
        if (message.author.bot) return;

        if (message.content.includes(prefix)) {
            const command = message.content.slice(2).trim();

            if (command === 'exit') {
                message.channel.send('Goodbye!');
                client.destroy();
            } else if (command === 'atc') {
                currentCommand = 'atc';
                await message.channel.send('Entering ATC mode. Type `>exit` to return.');
                await handleSubcommand(message, currentCommand);
            } else if (command === 'instructor') {
                currentCommand = 'instructor';
                await message.channel.send('Entering Instructor mode. Type `>exit` to return.');
                await handleSubcommand(message, currentCommand);
            } else {
                message.channel.send('Unknown command. Use `::atc`, `::instructor`, or `::exit`.');
            }
        }
    });

    async function handleSubcommand(message, type) {
        const filter = response => response.author.id === message.author.id;
        const collector = message.channel.createMessageCollector({ filter, time: 60000 });

        collector.on('collect', async (response) => {
            if (response.content === 'exit' || response.content === '>exit') {
                currentCommand = '';
                await message.channel.send('Returning to main menu.');
                collector.stop();
            } else {
                try {
                    let result;
                    if (type === 'atc') {
                        result = await app.getService(response.content);
                    } else if (type === 'instructor') {
                        result = await app.instructPilot(response.content);
                    }
                    message.channel.send(result || 'Command executed successfully.');
                } catch (err) {
                    message.channel.send('Error executing command: ' + err.message);
                }
            }
        });

        collector.on('end', (collected, reason) => {
            if (reason === 'time') {
                message.channel.send('Session timed out. Returning to main menu.');
            }
        });
    }

    client.on('ready', () => {
        console.log(`Logged in as ${client.user.tag}!`);
    });

    client.login(process.env.TOKEN); // Replace with your bot's token
}

async function handleReadline() {
    const answer = await question('Enter "atc" or "instructor": ');
    if (answer === 'atc') {
        await handleSubcommand('atc');
    } else if (answer === 'instructor') {
        await handleSubcommand('instructor');
    } else {
        console.log('Unknown command. Try "atc", "instructor", or "::exit".');
    }
}

function promptMain() {
    rl.question('::', async (answer) => {
        if (answer === 'exit' || answer === '::exit') {
            rl.close();
            return;
        }

        if (answer === 'discord') {
            await discord();
            rl.close();
            return;
        }

        if (answer === 'readline') {
            await handleReadline();
        }

        promptMain(); // Loop back
    });
}

async function handleSubcommand(type) {
    while (true) {
        const message = await question('>');

        if (message === 'exit' || message === '>exit') {
            console.log(`Returning to main menu.`);
            break;
        }

        try {
            if (type === 'atc') {
                console.log(await app.getService(message));
            } else if (type === 'instructor') {
                console.log(await app.instructPilot(message));
            }
        } catch (err) {
            console.error('Error:', err.message);
        }
    }
}

function question(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

setTimeout(() => {
    promptMain();
}, 1000);
