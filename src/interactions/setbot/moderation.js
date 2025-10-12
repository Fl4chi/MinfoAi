// Patch: questa dashboard aggiorna in real-time dopo ogni interazione. Sequenza: deferUpdate > update DB > rebuild config > buildDashboard > editReply
// Refactored: 2025-10-12 - Dashboard moderation con aggiornamento live immediato
// Pattern: onComponent, onModal, buildDashboard (ref: verification.js)
const db = require('../../database/db');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType } = require('discord.js');

// Helper: get channels
function getTextChannels(interaction) {
  return interaction.guild.channels.cache
    .filter(c => c.type === ChannelType.GuildText)
    .map(c => ({ label: `#${c.name}`, value: c.id }))
    .slice(0, 24);
}

// Helper: ensure config
function ensureConfig(interaction) {
  let cfg = interaction.client.guildConfigs.get(interaction.guildId);
  if (!cfg) {
    cfg = {
      guildId: interaction.guildId,
      moderationEnabled: false,
      moderationLogChannelId: null,
      moderationAutomodEnabled: false
    };
    interaction.client.guildConfigs.set(interaction.guildId, cfg);
  }
  if (cfg.moderationAutomodEnabled === undefined) cfg.moderationAutomodEnabled = false;
  return cfg;
}

// Build dashboard embed + components
function buildDashboard(interaction) {
  const cfg = ensureConfig(interaction);
  const channels = getTextChannels(interaction);
  
  const embed = new EmbedBuilder()
    .setTitle('🚪 Configurazione Moderation')
    .setColor(0xff5555)
    .setDescription(
      `**Status:** ${cfg.moderationEnabled ? '✅ Abilitato' : '❌ Disabilitato'}\n` +
      `**Canale Log:** ${cfg.moderationLogChannelId ? `<#${cfg.moderationLogChannelId}>` : 'Nessun canale'}\n` +
      `**Automod:** ${cfg.moderationAutomodEnabled ? '✅ Abilitato' : '❌ Disabilitato'}`
    )
    .setTimestamp();

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('moderation_config_select')
    .setPlaceholder('Seleziona configurazione')
    .addOptions(
      { label: 'Canale Log', value: 'channel_log', emoji: '📢' }
    );

  const row1 = new ActionRowBuilder().addComponents(selectMenu);
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('moderation_toggle')
      .setLabel(cfg.moderationEnabled ? 'Disabilita' : 'Abilita')
      .setStyle(cfg.moderationEnabled ? 4 : 3),
    new ButtonBuilder()
      .setCustomId('moderation_toggle_automod')
      .setLabel(`Automod: ${cfg.moderationAutomodEnabled ? 'ON' : 'OFF'}`)
      .setStyle(cfg.moderationAutomodEnabled ? 3 : 2)
  );

  return { embed, rows: [row1, row2] };
}

// Handle select menu
async function handleSelect(interaction, value) {
  // PATCH: sempre deferUpdate all'inizio
  await interaction.deferUpdate();
  const cfg = ensureConfig(interaction);

  if (value === 'channel_log') {
    const channels = getTextChannels(interaction);
    if (channels.length === 0) {
      return interaction.editReply({ content: 'Nessun canale testuale disponibile.', components: [], embeds: [] });
    }
    const select = new StringSelectMenuBuilder()
      .setCustomId('moderation_channel_log_select')
      .setPlaceholder('Scegli canale log')
      .addOptions(channels);
    const row = new ActionRowBuilder().addComponents(select);
    return interaction.editReply({ content: 'Seleziona il canale per i log di moderazione:', components: [row], embeds: [] });
  }

  const { embed, rows } = buildDashboard(interaction);
  return interaction.editReply({ embeds: [embed], components: rows });
}

// Handle buttons
async function handleComponent(interaction) {
  if (interaction.customId === 'moderation_toggle') {
    // PATCH: sempre deferUpdate all'inizio
    await interaction.deferUpdate();
    const cfg = ensureConfig(interaction);
    cfg.moderationEnabled = !cfg.moderationEnabled;

    // PATCH: update DB prima
    await db.updateGuildConfig(interaction.guildId, { moderationEnabled: cfg.moderationEnabled });

    // PATCH: rebuild config subito prima del dashboard
    const freshCfg = await db.getGuildConfig(interaction.guildId);
    if (freshCfg) {
      interaction.client.guildConfigs.set(interaction.guildId, freshCfg);
    }

    const { embed, rows } = buildDashboard(interaction);
    // PATCH: usa editReply
    return interaction.editReply({ embeds: [embed], components: rows });
  }

  if (interaction.customId === 'moderation_toggle_automod') {
    // PATCH: sempre deferUpdate all'inizio
    await interaction.deferUpdate();
    const cfg = ensureConfig(interaction);
    cfg.moderationAutomodEnabled = !cfg.moderationAutomodEnabled;

    // PATCH: update DB prima
    await db.updateGuildConfig(interaction.guildId, { moderationAutomodEnabled: cfg.moderationAutomodEnabled });

    // PATCH: rebuild config subito prima del dashboard
    const freshCfg = await db.getGuildConfig(interaction.guildId);
    if (freshCfg) {
      interaction.client.guildConfigs.set(interaction.guildId, freshCfg);
    }

    const { embed, rows } = buildDashboard(interaction);
    // PATCH: usa editReply
    return interaction.editReply({ embeds: [embed], components: rows });
  }

  if (interaction.customId === 'moderation_channel_log_select') {
    // PATCH: sempre deferUpdate all'inizio
    await interaction.deferUpdate();
    const cfg = ensureConfig(interaction);
    const channelId = interaction.values?.[0];
    cfg.moderationLogChannelId = channelId;

    // PATCH: update DB prima
    await db.updateGuildConfig(interaction.guildId, { moderationLogChannelId: channelId });

    // PATCH: rebuild config subito prima del dashboard
    const freshCfg = await db.getGuildConfig(interaction.guildId);
    if (freshCfg) {
      interaction.client.guildConfigs.set(interaction.guildId, freshCfg);
    }

    const { embed, rows } = buildDashboard(interaction);
    // PATCH: usa editReply
    return interaction.editReply({ embeds: [embed], components: rows });
  }
}

module.exports = {
  // Entrypoint to render dashboard
  async handleModeration(interaction) {
    const { embed, rows } = buildDashboard(interaction);
    if (interaction.replied || interaction.deferred) {
      return interaction.editReply({ embeds: [embed], components: rows });
    }
    return interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
  },

  // Router for selects/buttons
  async onComponent(interaction) {
    const id = interaction.customId;
    if (id === 'moderation_config_select') {
      const v = interaction.values?.[0];
      return handleSelect(interaction, v);
    }
    return handleComponent(interaction);
  },

  // Router for modals (none in this module currently)
  async onModal(interaction) {
    // No modals in moderation dashboard currently
    return interaction.editReply({ content: 'Modal non supportata.', components: [], embeds: [] });
  }
};
