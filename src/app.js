const { Client } = require('discord.js');
const Service = require('./service');
const { Groq } = require('groq-sdk')
const { createInterface } = require('node:readline');
const spawn = require('child_process').spawn
const prism = require('prism-media');
const ffmpeg = require('ffmpeg-static');
const { joinVoiceChannel, createAudioPlayer, createAudioResource, getVoiceConnection, AudioPlayerStatus } = require('@discordjs/voice')
const axios = require('axios')
const fs = require('fs')

const app = new Service();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});

async function discord() {
    const client = new Client({ intents: ["Guilds", "GuildMessages", "DirectMessages", "MessageContent", "GuildVoiceStates"] });

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
            } else if (command === 'atis') {
                currentCommand = 'atis';
                await message.channel.send('Entering ATIS mode. Type `>exit` to return.');
                await handleSubcommand(message, currentCommand);
            } else if (command === 'vcchat atc') {
                currentCommand = 'vcchat atc';
                await message.channel.send('Joining VC and enabling chat. Type `>exit` to stop.');
                await handleVCChat(message);
            } else if (command === 'vcchat end') {
                getVoiceConnection(message.guild.id)?.destroy();
            } else {
                message.channel.send('Unknown command. Use `::atc`, `::instructor`, or `::exit`.');
            }
        }
    });

    async function handleVCChat(message) {
        const { channel } = message.member.voice;
        if (!channel) return message.reply('You must be in a VC.');
    
        const connection = joinVoiceChannel({
            selfDeaf: false,
            selfMute: false,
            channelId: channel.id,
            guildId: message.guild.id,
            adapterCreator: message.guild.voiceAdapterCreator
        });
    
        const userId = message.author.id;
    
        message.channel.send('Starting voice chat. Say "End the call" to stop.');
    
        async function listenLoop() {
            const receiver = connection.receiver;
            const audioStream = receiver.subscribe(userId, {
                end: { behavior: 'silence', duration: 1000 }
            });
    
            const oggStream = new prism.opus.Decoder({ rate: 48000, channels: 2, frameSize: 960 });
    
            const outputFile = `./config/audio_${userId}.pcm`;
            if (fs.existsSync(outputFile)) fs.unlinkSync(outputFile);
            const writeStream = fs.createWriteStream(outputFile);
            audioStream.pipe(oggStream).pipe(writeStream);
    
            // Wait 7 seconds to capture speech
            await new Promise(resolve => setTimeout(resolve, 7000));
            writeStream.end();
    
            // Convert PCM to WAV
            const wavOutput = `./config/audio_${userId}.wav`;
            if (fs.existsSync(wavOutput)) fs.unlinkSync(wavOutput);
    
            await new Promise(resolve => {
                spawn(ffmpeg, ['-f', 's16le', '-ar', '48000', '-ac', '2', '-i', outputFile, wavOutput])
                    .on('exit', resolve);
            });
    
            // Transcribe
            const transcription = await transcribe(wavOutput);
            if (!transcription) {
                await message.channel.send('Could not understand.');
                return listenLoop(); // Continue
            }
    
            if (transcription.toLowerCase().includes('end the call')) {
                getVoiceConnection(message.guild.id)?.destroy();
                return message.channel.send('Call ended.');
            }
    
            await message.channel.send(`You said: **${transcription}**`);
    
            const reply = await app.getService(transcription, message.author.username);
            await message.channel.send(`Groq: ${reply}`);
                
            // Convert Groq response to speech
            const url = await groq.audio.speech.create({
                'input': reply,
                'model': 'playai-tts',
                'response_format': 'wav',
                'voice': 'Arista-PlayAI'
            })
            const speechFilePath = `./config/speech_${userId}.wav`;
            const audio = Buffer.from(await url.arrayBuffer());
            await fs.promises.writeFile(speechFilePath, audio);
    
            // Play reply in VC
            const audioPlayer = createAudioPlayer();
            const resource = createAudioResource(fs.createReadStream(speechFilePath));
            audioPlayer.play(resource);
            connection.subscribe(audioPlayer);
    
            // Wait for playback to finish before looping
            audioPlayer.once(AudioPlayerStatus.Idle, () => listenLoop());
        }
    
        listenLoop();
    }  
    
    async function transcribe(wavPath) {    
        const resp = await groq.audio.transcriptions.create({
            'file': fs.createReadStream(wavPath),
            'model': 'whisper-large-v3',
            'language': 'en',
        })
    
        return resp.text.trim() || null;
    }

    async function handleSubcommand(message, type) {
        const filter = response => response.author.id === message.author.id;
        const collector = message.channel.createMessageCollector({ filter, time: 6000000 });

        collector.on('collect', async (response) => {
            if (response.content === 'exit' || response.content === '>exit') {
                currentCommand = '';
                await message.channel.send('Returning to main menu.');
                collector.stop();
            } else {
                try {
                    let result;
                    if (type === 'atc') {
                        result = await app.getService(response.content, message.author.username);
                    } else if (type === 'instructor') {
                        result = await app.instructPilot(response.content, message.author.username);
                    } else if (type === 'atis') {
                        app.setATIS(response.content)
                        result = 'ATIS updated.';
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
