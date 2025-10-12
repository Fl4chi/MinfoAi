const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database/db');
const welcomeHandler = require('../interactions/setbot/welcome');
const goodbyeHandler = require('../interactions/setbot/goodbye');
const musicHandler = require('../interactions/setbot/music');
const moderationHandler = require('../interactions/setbot/moderation');
const gamificationHandler = require('../interactions/setbot/gamification');
const giveawayHandler = require('../interactions/setbot/giveaway');
const verifyHandler = require('../interactions/setbot/verification');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setbot')
    .setDescription('Configura il bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const config = await db.getGuildConfig(interaction.guild.id) || {};
    await welcomeHandler.showPanel(interaction, config);
  },
  async onCategorySelect(interaction) {
    const category = interaction.values[0];
    const config = await db.getGuildConfig(interaction.guild.id) || {};
    
    const handlers = {
      welcome: welcomeHandler,
      goodbye: goodbyeHandler,
      music: musicHandler,
      moderation: moderationHandler,
      gamification: gamificationHandler,
      giveaway: giveawayHandler,
      verify: verifyHandler
    };

    const handler = handlers[category];
    if (handler) {
      await handler.showPanel(interaction, config);
    }
  }
};
