require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs = require('fs');
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

// Load commands from directory
async function loadCommands(client, commandsPath) {
  if (!fs.existsSync(commandsPath)) {
    console.log('[MinfoAi] Commands directory not found, skipping...');
    return;
  }

  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  
  for (const file of commandFiles) {
    try {
      const command = require(path.join(commandsPath, file));
      if (command.data && command.data.name) {
        client.commands.set(command.data.name, command);
        console.log(`[MinfoAi] Loaded command: ${command.data.name}`);
      }
    } catch (err) {
      console.error(`[MinfoAi] Error loading command ${file}:`, err);
    }
  }
}

// Load events from directory
async function loadEvents(client, eventsPath) {
  if (!fs.existsSync(eventsPath)) {
    console.log('[MinfoAi] Events directory not found, skipping...');
    return;
  }

  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  
  for (const file of eventFiles) {
    try {
      const event = require(path.join(eventsPath, file));
      if (event.name) {
        if (event.once) {
          client.once(event.name, (...args) => event.execute(...args, client));
        } else {
          client.on(event.name, (...args) => event.execute(...args, client));
        }
        console.log(`[MinfoAi] Loaded event: ${event.name}`);
      }
    } catch (err) {
      console.error(`[MinfoAi] Error loading event ${file}:`, err);
    }
  }
}

// Start the bot
(async () => {
  try {
    await loadCommands(client, path.join(__dirname, 'commands'));
    await loadEvents(client, path.join(__dirname, 'events'));
    await client.login(process.env.DISCORD_TOKEN);
    console.log('[MinfoAi] Bot logged in successfully.');
  } catch (err) {
    console.error('[MinfoAi] Fatal startup error:', err);
    process.exit(1);
  }
})();

module.exports = client;
