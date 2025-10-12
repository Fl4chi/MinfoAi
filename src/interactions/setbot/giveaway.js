// Refactored: 2025-10-12 - Dashboard giveaway con aggiornamento live immediato
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
      giveawayEnabled: false,
      giveawayChannelId: null,
      giveawayDuration: 86400
    };
    interaction.client.guildConfigs.set(interaction.guildId, cfg);
  }
  if (cfg.giveawayDuration === undefined) cfg.giveawayDuration = 86400;
  return cfg;
}

// Build dashboard embed + components
function buildDashboard(interaction) {
  const cfg = ensureConfig(interaction);
  const channels = getTextChannels(interaction);
  
  const embed = new EmbedBuilder()
    .setTitle('⚙️ Configurazione: Giveaway')
    .setColor(cfg.giveawayEnabled ? '#43B581' : '#ED4245')
    .addFields(
      { name: 'Canale Giveaway', value: cfg.giveawayChannelId ? `<#${cfg.giveawayChannelId}>` : 'Non impostato', inline: false },
      { name: 'Durata Default', value: `${cfg.giveawayDuration || 86400} secondi`, inline: true },
      { name: 'Sistema', value: cfg.giveawayEnabled ? '🟢 ON' : '🔴 OFF', inline: true }
    );

  const rows = [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('giveaway_channel_select')
        .setPlaceholder(cfg.giveawayChannelId ? 'Canale impostato' : 'Seleziona canale giveaway')
        .addOptions([{ label: 'Nessuno', value: 'none' }, ...channels])
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('giveaway_set_duration')
        .setLabel('Imposta Durata')
        .setStyle(1)
        .setEmoji('⏰'),
      new ButtonBuilder()
        .setCustomId('giveaway_toggle')
        .setLabel(cfg.giveawayEnabled ? 'Disattiva' : 'Attiva')
        .setStyle(cfg.giveawayEnabled ? 4 : 3)
    )
  ];

  return { embed, rows };
}

// Handle select menu changes
async function handleSelect(interaction, value) {
  await interaction.deferUpdate();
  const cfg = ensureConfig(interaction);
  const newVal = value === 'none' ? null : value;
  cfg.giveawayChannelId = newVal;
  await db.updateGuildConfig(interaction.guildId, { giveawayChannelId: newVal });
  interaction.client.guildConfigs.set(interaction.guildId, cfg);
  const { embed, rows } = buildDashboard(interaction);
  return interaction.editReply({ embeds: [embed], components: rows });
}

// Handle button clicks
async function handleComponent(interaction) {
  const id = interaction.customId;
  
  if (id === 'giveaway_toggle') {
    await interaction.deferUpdate();
    const cfg = ensureConfig(interaction);
    cfg.giveawayEnabled = !cfg.giveawayEnabled;
    await db.updateGuildConfig(interaction.guildId, { giveawayEnabled: cfg.giveawayEnabled });
    interaction.client.guildConfigs.set(interaction.guildId, cfg);
    const { embed, rows } = buildDashboard(interaction);
    return interaction.editReply({ embeds: [embed], components: rows });
  }

  if (id === 'giveaway_set_duration') {
    const modal = new ModalBuilder()
      .setCustomId('giveaway_duration_modal')
      .setTitle('Imposta Durata Default');
    const input = new TextInputBuilder()
      .setCustomId('giveaway_duration_input')
      .setLabel('Durata in secondi')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('86400 (24 ore)')
      .setRequired(true)
      .setValue(String(ensureConfig(interaction).giveawayDuration || 86400));
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    return interaction.showModal(modal);
  }
}

// Handle modal submits
async function handleModals(interaction) {
  if (interaction.customId === 'giveaway_duration_modal') {
    await interaction.deferUpdate();
    const duration = parseInt(interaction.fields.getTextInputValue('giveaway_duration_input')) || 86400;
    const cfg = ensureConfig(interaction);
    cfg.giveawayDuration = duration;
    await db.updateGuildConfig(interaction.guildId, { giveawayDuration: duration });
    interaction.client.guildConfigs.set(interaction.guildId, cfg);
    const { embed, rows } = buildDashboard(interaction);
    return interaction.editReply({ embeds: [embed], components: rows });
  }
}

module.exports = {
  // Entrypoint to render dashboard
  async handleGiveaway(interaction) {
    const { embed, rows } = buildDashboard(interaction);
    if (interaction.replied || interaction.deferred) {
      return interaction.editReply({ embeds: [embed], components: rows });
    }
    return interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
  },

  // Router for selects/buttons
  async onComponent(interaction) {
    const id = interaction.customId;
    if (id === 'giveaway_channel_select') {
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
