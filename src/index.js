const { Client, Intents } = require('discord.js');
require('dotenv').config();

const trivia = require('./commands/trivia');

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES] });

const commandList = {
  ping: {
    description: 'Respond with pong',
    execute: (msg) => {
      msg.reply("pong");
    },
  },
  trivia,
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
  // Change status to do not disturb so users know you are adding features
  // TODO: Change to online in production
  client.user.setStatus('dnd');
  client.user.setActivity({
    name: '!js help (dev mode)',
    type: 'LISTENING',
  });
  // Catch cntrl+c
  process.on('SIGINT', (code) => {
    console.log(`About to exit with code: ${code}`);
    // The bot takes a time before going to invisible, so change status to idle
    client.user.setStatus('idle');
    process.exit();
  });
});

client.on("messageCreate", msg => {
  if (msg.content.match(/^\!js /)) {
    const validMessage = msg.content.split('!js ')[1];
    const commandArray = validMessage.split(' ');
    const [command, ...args] = commandArray;
    
    if (typeof commandList[command] !== 'undefined') {
      commandList[command].execute(msg, args);
    } else {
      let response = 'List of commands:\n\n';
      response += Object.keys(commandList)
        .map((key) => `!js ${key}: ${commandList[key].description}`)
        .join('\n');
      msg.reply(response);
    }
  }
});

client.login(process.env.TOKEN);