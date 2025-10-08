require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');

const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message, Partials.Reaction, Partials.GuildMember, Partials.User],
});

client.commands = new Collection();
client.events = new Collection();
client.config = {
  prefix: process.env.PREFIX || '!',
};

// Loader utils (lazy placeholder, real implementations in utils)
const { loadCommands } = require('./utils/loader');
const { loadEvents } = require('./utils/loader');

(async () => {
  try {
    await loadCommands(client, path.join(__dirname, 'commands'));
    await loadEvents(client, path.join(__dirname, 'events'));

    await client.login(process.env.DISCORD_TOKEN);
    console.log('[MinfoAi] Bot logged in.');
  } catch (err) {
    console.error('[MinfoAi] Fatal startup error:', err);
    process.exit(1);
  }
})();
