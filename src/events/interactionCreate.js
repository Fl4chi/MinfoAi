const { Events } = require('discord.js');
// Import dashboard handlers
const verification = require('../interactions/setbot/verification');
const welcome = require('../interactions/setbot/welcome');
const goodbye = require('../interactions/setbot/goodbye');
const gamification = require('../interactions/setbot/gamification');
const moderation = require('../interactions/setbot/moderation');
const music = require('../interactions/setbot/music');
const giveaway = require('../interactions/setbot/giveaway');
const setbot = require('../commands/setbot');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
      }
      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`Error executing ${interaction.commandName}:`, error);
        // Robust error handling with reply safety
        const errorMessage = {
          content: 'There was an error while executing this command!',
          ephemeral: true
        };
        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
          } else {
            await interaction.reply(errorMessage);
          }
        } catch (replyError) {
          console.error('Could not send error message to user:', replyError);
        }
      }
    }
    // Handle button interactions
    // REFACTOR: Route dashboard button interactions to onComponent handlers
    else if (interaction.isButton()) {
      console.log(`Button interaction: ${interaction.customId}`);
      // Route to appropriate dashboard handler
      const id = interaction.customId;
      try {
        if (id.startsWith('verification_')) {
          await verification.onComponent(interaction);
        } else if (id.startsWith('welcome_')) {
          await welcome.onComponent(interaction);
        } else if (id.startsWith('goodbye_')) {
          await goodbye.onComponent(interaction);
        } else if (id.startsWith('gamification_')) {
          await gamification.onComponent(interaction);
        } else if (id.startsWith('moderation_')) {
          await moderation.onComponent(interaction);
        } else if (id.startsWith('music_')) {
          await music.onComponent(interaction);
        } else if (id.startsWith('giveaway_')) {
          await giveaway.onComponent(interaction);
        } else if (id === 'verify_button') {
          // Special case: public verification button
          await verification.onVerify(interaction);
        } else {
          console.warn(`Unhandled button interaction: ${id}`);
        }
      } catch (error) {
        console.error(`Error handling button interaction ${id}:`, error);
      }
    }
    // Handle select menu interactions
    // REFACTOR: Route dashboard select menu interactions to onComponent handlers
    else if (interaction.isStringSelectMenu()) {
      console.log(`Select menu interaction: ${interaction.customId}`);
      // Route to appropriate dashboard handler
      const id = interaction.customId;
      try {
        if (id === 'setbot_category') {
          await setbot.onCategorySelect(interaction);
        } else if (id.startsWith('verification_') || id === 'verification_config_select') {
          await verification.onComponent(interaction);
        } else if (id.startsWith('welcome_') || id === 'welcome_config_select') {
          await welcome.onComponent(interaction);
        } else if (id.startsWith('goodbye_') || id === 'goodbye_config_select') {
          await goodbye.onComponent(interaction);
        } else if (id.startsWith('gamification_') || id === 'gamification_config_select') {
          await gamification.onComponent(interaction);
        } else if (id.startsWith('moderation_') || id === 'moderation_config_select') {
          await moderation.onComponent(interaction);
        } else if (id.startsWith('music_') || id === 'music_config_select') {
          await music.onComponent(interaction);
        } else if (id.startsWith('giveaway_') || id === 'giveaway_config_select') {
          await giveaway.onComponent(interaction);
        } else {
          console.warn(`Unhandled select menu interaction: ${id}`);
        }
      } catch (error) {
        console.error(`Error handling select menu interaction ${id}:`, error);
      }
    }
    // Handle modal submissions
    // REFACTOR: Route dashboard modal submissions to onModal handlers
    else if (interaction.isModalSubmit()) {
      console.log(`Modal submit interaction: ${interaction.customId}`);
      // Route to appropriate dashboard handler
      const id = interaction.customId;
      try {
        if (id.startsWith('verification_')) {
          await verification.onModal(interaction);
        } else if (id.startsWith('welcome_')) {
          await welcome.onModal(interaction);
        } else if (id.startsWith('goodbye_')) {
          await goodbye.onModal(interaction);
        } else if (id.startsWith('gamification_')) {
          await gamification.onModal(interaction);
        } else if (id.startsWith('moderation_')) {
          await moderation.onModal(interaction);
        } else if (id.startsWith('music_')) {
          await music.onModal(interaction);
        } else if (id.startsWith('giveaway_')) {
          await giveaway.onModal(interaction);
        } else {
          console.warn(`Unhandled modal submit interaction: ${id}`);
        }
      } catch (error) {
        console.error(`Error handling modal submit interaction ${id}:`, error);
      }
    }
  },
};
