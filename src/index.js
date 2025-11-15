require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Partials } = require('discord.js');
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const commandHandler = require('./handlers/commandHandler');
const eventHandler = require('./handlers/eventHandler');

// Create Discord client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.GuildMember],
});

// Initialize commands collection
client.commands = new Collection();

// Load commands and events
(async () => {
  try {
    await commandHandler(client);
    await eventHandler(client);
    logger.success('All handlers loaded successfully');
  } catch (error) {
    logger.error('Error loading handlers:', error);
    process.exit(1);
  }
})();

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => logger.success('Connected to MongoDB'))
  .catch((err) => {
    logger.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Global error handlers
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled promise rejection:', error);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception:', error);
  process.exit(1);
});

// Login to Discord
client.login(process.env.TOKEN).catch((error) => {
  logger.error('Failed to login:', error);
  process.exit(1);
});
