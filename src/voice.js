const {
    joinVoiceChannel,
    createAudioPlayer,
    createAudioResource,
    StreamType,
    getVoiceConnection,
    VoiceReceiver
  } = require('@discordjs/voice');
  const { Client, GatewayIntentBits } = require('discord.js');
  const fs = require('fs');
  const prism = require('prism-media');
  const axios = require('axios');
  const { Readable } = require('stream');
  const googleTTS = require('google-tts-api');
  
  class Voice {
    constructor(options) {
      this.token = options.token;
      this.channelId = options.channelId;
      this.guildId = options.guildId;
      this.groqApiKey = options.groqApiKey;
      this.client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });
    }
  
    async start() {
      this.client.on('ready', async () => {
        console.log(`Logged in as ${this.client.user.tag}`);
        this.connectToVC();
      });
  
      this.client.login(this.token);
    }
  
    connectToVC() {
      const connection = joinVoiceChannel({
        channelId: this.channelId,
        guildId: this.guildId,
        adapterCreator: this.client.guilds.cache.get(this.guildId).voiceAdapterCreator
      });
  
      this.listenToSpeech(connection);
    }
  
    listenToSpeech(connection) {
      const receiver = connection.receiver;
  
      connection.on('speaking', (user, speaking) => {
        if (speaking.bitfield === 0) return;
  
        const audioStream = receiver.subscribe(user.id, {
          end: {
            behavior: 'silence',
            duration: 1000
          }
        });
  
        const oggStream = new prism.opus.Decoder({ rate: 48000, channels: 2, frameSize: 960 });
  
        const outPath = `./recordings/${user.id}-${Date.now()}.pcm`;
        const writable = fs.createWriteStream(outPath);
  
        audioStream.pipe(oggStream).pipe(writable);
  
        writable.on('finish', async () => {
          const text = await this.transcribeSpeech(outPath);
          if (text) {
            const response = await this.queryGroq(text);
            this.speak(connection, response);
          }
          fs.unlinkSync(outPath);
        });
      });
    }
  
    async transcribeSpeech(filePath) {
      const audioData = fs.readFileSync(filePath);
  
      const openai = require("openai");
      const client = new openai.OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
      const response = await client.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: "whisper-1"
      });
  
      console.log("Transcribed:", response.text);
      return response.text;
    }
  
    async queryGroq(prompt) {
      const response = await axios.post(
        'https://api.groq.com/openai/v1/chat/completions',
        {
          model: 'llama3-8b-8192',
          messages: [{ role: 'user', content: prompt }]
        },
        {
          headers: {
            Authorization: `Bearer ${this.groqApiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );
  
      const reply = response.data.choices[0].message.content;
      console.log("Groq replied:", reply);
      return reply;
    }
  
    async speak(connection, text) {
      const url = googleTTS.getAudioUrl(text, {
        lang: 'en',
        slow: false,
        host: 'https://translate.google.com',
      });
  
      const stream = await axios({
        url,
        method: 'GET',
        responseType: 'stream'
      });
  
      const resource = createAudioResource(stream.data, {
        inputType: StreamType.Arbitrary
      });
  
      const player = createAudioPlayer();
      player.play(resource);
      connection.subscribe(player);
    }
  }
  
  module.exports = Voice;
  