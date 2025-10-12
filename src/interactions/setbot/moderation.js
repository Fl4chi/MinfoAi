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
    .setTitle('⚙️ Configurazione: Moderation')
    .setColor(cfg.moderationEnabled ? '#43B581' : '#ED4245')
    .addFields(
      { name: 'Canale Log', value: cfg.moderationLogChannelId ? `<#${cfg.moderationLogChannelId}>` : 'Non impostato', inline: false },
      { name: 'Automod', value: cfg.moderationAutomodEnabled ? '🟢 ON' : '🔴 OFF', inline: true },
      { name: 'Sistema', value: cfg.moderationEnabled ? '🟢 ON' : '🔴 OFF', inline: true }
    );

  const rows = [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('moderation_channel_select')
        .setPlaceholder(cfg.moderationLogChannelId ? 'Canale impostato' : 'Seleziona canale log')
        .addOptions([{ label: 'Nessuno', value: 'none' }, ...channels])
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('moderation_toggle_automod')
        .setLabel(cfg.moderationAutomodEnabled ? 'Disattiva Automod' : 'Attiva Automod')
        .setStyle(cfg.moderationAutomodEnabled ? 4 : 3)
        .setEmoji('🤖'),
      new ButtonBuilder()
        .setCustomId('moderation_toggle')
        .setLabel(cfg.moderationEnabled ? 'Disattiva' : 'Attiva')
        .setStyle(cfg.moderationEnabled ? 4 : 3)
    )
  ];

  return { embed, rows };
}

// Handle select menu changes
async function handleSelect(interaction, value) {
  await interaction.deferUpdate();
  const cfg = ensureConfig(interaction);
  const newVal = value === 'none' ? null : value;
  cfg.moderationLogChannelId = newVal;
  await db.updateGuildConfig(interaction.guildId, { moderationLogChannelId: newVal });
  interaction.client.guildConfigs.set(interaction.guildId, cfg);
  const { embed, rows } = buildDashboard(interaction);
  return interaction.editReply({ embeds: [embed], components: rows });
}

// Handle button clicks
async function handleComponent(interaction) {
  const id = interaction.customId;
  
  if (id === 'moderation_toggle') {
    await interaction.deferUpdate();
    const cfg = ensureConfig(interaction);
    cfg.moderationEnabled = !cfg.moderationEnabled;
    await db.updateGuildConfig(interaction.guildId, { moderationEnabled: cfg.moderationEnabled });
    interaction.client.guildConfigs.set(interaction.guildId, cfg);
    const { embed, rows } = buildDashboard(interaction);
    return interaction.editReply({ embeds: [embed], components: rows });
  }

  if (id === 'moderation_toggle_automod') {
    await interaction.deferUpdate();
    const cfg = ensureConfig(interaction);
    cfg.moderationAutomodEnabled = !cfg.moderationAutomodEnabled;
    await db.updateGuildConfig(interaction.guildId, { moderationAutomodEnabled: cfg.moderationAutomodEnabled });
    interaction.client.guildConfigs.set(interaction.guildId, cfg);
    const { embed, rows } = buildDashboard(interaction);
    return interaction.editReply({ embeds: [embed], components: rows });
  }
}

// Handle modal submits (none for now, but structure is ready)
async function handleModals(interaction) {
  // Placeholder for future modal handlers
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
    if (id === 'moderation_channel_select') {
      const v = interaction.values?.[0];
      return handleSelect(interaction, v);
    }
    return handleComponent(interaction);
  },

  // Router for modals
  async onModal(interaction) {
    return handleModals(interaction);
  }
};
