const {
  EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder,
  ButtonBuilder, ButtonStyle, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionsBitField
} = require('discord.js');

function initializeGuildConfigs(client) {
  if (!client) throw new Error('Client object is required');
  if (!client.guildConfigs) client.guildConfigs = new Map();
}

function ensureGuildConfig(interaction) {
  if (!interaction || !interaction.client || !interaction.guild)
    throw new Error('Invalid interaction, client, or guild');
  const client = interaction.client;
  const guildId = interaction.guild.id;
  initializeGuildConfigs(client);
  if (!client.guildConfigs.has(guildId)) {
    client.guildConfigs.set(guildId, {
      selected: null,
      welcome: { enabled: false },
      verification: { enabled: false },
      music: { enabled: false },
      moderation: { enabled: false },
      goodbye: { enabled: false },
      giveaway: { enabled: false },
      gamification: { enabled: false }
    });
  }
  return client.guildConfigs.get(guildId);
}

function buildMainDashboard(interaction) {
  const categories = [
    { label: '👋 Benvenuto', value: 'welcome' },
    { label: '🔐 Verifica', value: 'verification' },
    { label: '🎵 Musica', value: 'music' },
    { label: '🛡️ Moderazione', value: 'moderation' },
    { label: '👋 Goodbye', value: 'goodbye' },
    { label: '🎁 Giveaway', value: 'giveaway' },
    { label: '🏆 Gamification', value: 'gamification' }
  ];
  return {
    embeds: [
      new EmbedBuilder().setTitle('📊 Dashboard MinfoAi').setDescription('Seleziona una categoria da configurare:')
    ],
    components: [
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('setbot:category')
          .setPlaceholder('Scegli la funzione...')
          .addOptions(categories)
      )
    ],
    ephemeral: true
  };
}

function buildVerificationDashboard(interaction, config) {
  const cfg = config.verification;
  const embed = new EmbedBuilder()
    .setTitle('🔐 Configurazione Verifica')
    .addFields(
      { name: 'Stato', value: cfg.enabled ? '🟢 Attivo' : '🔴 Disattivo', inline: true }
    );
  const buttons = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('verification:toggle')
      .setLabel(cfg.enabled ? '🔴 Spegni' : '🟢 Accendi')
      .setStyle(cfg.enabled ? ButtonStyle.Danger : ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('verification:reset')
      .setLabel('♻️ Reset')
      .setStyle(ButtonStyle.Secondary)
  );
  return { embeds: [embed], components: [buttons], ephemeral: true };
}

async function handleCategorySelect(interaction) {
  const config = ensureGuildConfig(interaction);
  const category = interaction.values?.[0];
  config.selected = category;
  if (category === 'verification') {
    return interaction.reply(buildVerificationDashboard(interaction, config));
  }
}

async function execute(interaction) {
  if (interaction.isChatInputCommand?.() && interaction.commandName === 'setbot') {
    return interaction.reply(buildMainDashboard(interaction));
  }
  if (interaction.isStringSelectMenu() && interaction.customId === 'setbot:category') {
    return handleCategorySelect(interaction);
  }
}

module.exports = {
  name: 'setbot',
  description: 'Dashboard principale MinfoAi con menu categorie',
  execute,
  initializeGuildConfigs,
  ensureGuildConfig
};
