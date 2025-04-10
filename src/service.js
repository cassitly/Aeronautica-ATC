require('dotenv').config({ path: './config/.env' });
const fetch = require('node-fetch').default;
const { Groq } = require('groq-sdk');
const path = require('path');
const fs = require('fs');

// Initialize the Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

module.exports = class Service {
  constructor() {
    this.memory = '';
    this.atis = 'No current ATIS information. Please wait for someone to input ATIS';
  }

  async getHandbook() {
    const handbookPath = path.resolve('./config/handbook');
    let textData = [];
    let imagePaths = [];
    let imageData = [];

    function readDirectoryRecursive(dirPath) {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
          readDirectoryRecursive(fullPath);
        } else if (entry.isFile()) {
          const ext = path.extname(entry.name).toLowerCase();
          if (['.txt', '.md'].includes(ext)) {
            textData.push(fs.readFileSync(fullPath, 'utf-8'));
          } else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(ext)) {
            imagePaths.push(fullPath);
          }
        }
      }
    }

    readDirectoryRecursive(handbookPath);

    async function passImage() {
      for (const img of imagePaths) {
        imageData.push(fs.readFileSync(img, { encoding: 'base64' }));
      }
    }

    await passImage();

    return {
      text: textData,
      images: imageData,
    };
  }

  async getService(message) {
    const { text, images } = await this.getHandbook();
    const handbook = text[0];
    this.memory += message;
    if (this.memory.length > 1000) this.memory = this.memory.slice(1000);
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an ATC controller for Aeronautica. The user will be the pilots, you are guiding. This is your handbook: \n${handbook}`,
        },
        {
          role: 'function',
          name: 'getMemory',
          content: JSON.stringify({
            text: this.memory,
          }),
        },
        {
            role: 'user',
            content: `A quick note before I give you ATIS info, if the info says "No current ATIS information. Please wait for someone to input ATIS", just ignore it. No one has given you ATIS yet, so just continue without it.\nThis is the current ATIS information: \n${this.atis}`,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'This is the map of the game, Aeronautica.' },
            {
              type: 'image_url',
              image_url: {
                url: `https://media.discordapp.net/attachments/1308795555736195215/1359855428690772141/Enroute_Flat_V8.1.png?ex=67f8ff8f&is=67f7ae0f&hm=418e4fbcb146e0a4f355999de1e9aa06f323343a6488d8be8dc82f45e2878dc8&=&format=webp&quality=lossless&width=975&height=975`,
              },
            },
          ],
        },
        {
          role: 'user',
          content: message,
        },
      ],
      model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    });

    this.memory += chatCompletion.choices[0].message.content;
    return chatCompletion.choices[0].message.content;
  }

  async instructPilot(message) {
    const { text, images } = await this.getHandbook();
    const handbook = text[1];
    this.memory += message;
    if (this.memory.length > 1000) this.memory = this.memory.slice(1000);
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a pilot instructor, and you have a pilot handbook to instruct pilots and answer their questions. This is your handbook: \n${handbook}`,
        },
        {
          role: 'function',
          name: 'getMemory',
          content: JSON.stringify({
            text: this.memory,
          }),
        },
        {
            role: 'user',
            content: `A quick note before I give you ATIS info, if the info says "No current ATIS information. Please wait for someone to input ATIS", just ignore it. No one has given you ATIS yet, so just continue without it.\nThis is the current ATIS information: \n${this.atis}`,
        },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'This is the map of the game, Aeronautica.' },
            {
              type: 'image_url',
              image_url: {
                url: `https://media.discordapp.net/attachments/1308795555736195215/1359855428690772141/Enroute_Flat_V8.1.png?ex=67f8ff8f&is=67f7ae0f&hm=418e4fbcb146e0a4f355999de1e9aa06f323343a6488d8be8dc82f45e2878dc8&=&format=webp&quality=lossless&width=975&height=975`,
              },
            },
          ],
        },
        {
          role: 'user',
          content: message,
        },
      ],
      model: 'meta-llama/llama-4-maverick-17b-128e-instruct',
    });

    this.memory += chatCompletion.choices[0].message.content;
    return chatCompletion.choices[0].message.content;
  }

  async setATIS(info) {
    this.atis = info; // Sets the info
  }
};


// fetch('https://media.discordapp.net/attachments/1308795555736195215/1359855428690772141/Enroute_Flat_V8.1.png?ex=67f8ff8f&is=67f7ae0f&hm=418e4fbcb146e0a4f355999de1e9aa06f323343a6488d8be8dc82f45e2878dc8&=&format=webp&quality=lossless&width=975&height=975')
//   .then((response) => console.log(response))