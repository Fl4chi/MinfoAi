// Refactored: 2025-10-12 - Dashboard music con aggiornamento live immediato
// Pattern: onComponent, onModal, buildDashboard (ref: verification.js)

const db = require('../../database/db');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType } = require('discord.js');

// Helper: get voice channels
function getVoiceChannels(interaction) {
  return interaction.guild.channels.cache
    .filter(c => c.type === ChannelType.GuildVoice)
    .map(c => ({ label: c.name, value: c.id }))
    .slice(0, 24);
}

// Helper: ensure config
function ensureConfig(interaction) {
  let cfg = interaction.client.guildConfigs.get(interaction.guildId);
  if (!cfg) {
    cfg = {
      guildId: interaction.guildId,
      musicEnabled: false,
      musicVoiceChannelId: null,
      musicVolume: 50
    };
    interaction.client.guildConfigs.set(interaction.guildId, cfg);
  }
  if (cfg.musicVolume === undefined) cfg.musicVolume = 50;
  return cfg;
}

// Build dashboard embed + components
function buildDashboard(interaction) {
  const cfg = ensureConfig(interaction);
  const channels = getVoiceChannels(interaction);
  
  const embed = new EmbedBuilder()
    .setTitle('⚙️ Configurazione: Music')
    .setColor(cfg.musicEnabled ? '#43B581' : '#ED4245')
    .addFields(
      { name: 'Canale Vocale', value: cfg.musicVoiceChannelId ? `<#${cfg.musicVoiceChannelId}>` : 'Non impostato', inline: false },
      { name: 'Volume', value: `${cfg.musicVolume || 50}%`, inline: true },
      { name: 'Sistema', value: cfg.musicEnabled ? '🟢 ON' : '🔴 OFF', inline: true }
    );

  const rows = [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('music_channel_select')
        .setPlaceholder(cfg.musicVoiceChannelId ? 'Canale impostato' : 'Seleziona canale vocale')
        .addOptions([{ label: 'Nessuno', value: 'none' }, ...channels])
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('music_set_volume')
        .setLabel('Imposta Volume')
        .setStyle(1)
        .setEmoji('🔊'),
      new ButtonBuilder()
        .setCustomId('music_toggle')
        .setLabel(cfg.musicEnabled ? 'Disattiva' : 'Attiva')
        .setStyle(cfg.musicEnabled ? 4 : 3)
    )
  ];

  return { embed, rows };
}

// Handle select menu changes
async function handleSelect(interaction, value) {
  await interaction.deferUpdate();
  const cfg = ensureConfig(interaction);
  const newVal = value === 'none' ? null : value;
  cfg.musicVoiceChannelId = newVal;
  await db.updateGuildConfig(interaction.guildId, { musicVoiceChannelId: newVal });
  interaction.client.guildConfigs.set(interaction.guildId, cfg);
  const { embed, rows } = buildDashboard(interaction);
  return interaction.editReply({ embeds: [embed], components: rows });
}

// Handle button clicks
async function handleComponent(interaction) {
  const id = interaction.customId;
  
  if (id === 'music_toggle') {
    await interaction.deferUpdate();
    const cfg = ensureConfig(interaction);
    cfg.musicEnabled = !cfg.musicEnabled;
    await db.updateGuildConfig(interaction.guildId, { musicEnabled: cfg.musicEnabled });
    interaction.client.guildConfigs.set(interaction.guildId, cfg);
    const { embed, rows } = buildDashboard(interaction);
    return interaction.editReply({ embeds: [embed], components: rows });
  }

  if (id === 'music_set_volume') {
    const modal = new ModalBuilder()
      .setCustomId('music_volume_modal')
      .setTitle('Imposta Volume');
    const input = new TextInputBuilder()
      .setCustomId('music_volume_input')
      .setLabel('Volume (0-100)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('50')
      .setRequired(true)
      .setValue(String(ensureConfig(interaction).musicVolume || 50));
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    return interaction.showModal(modal);
  }
}

// Handle modal submits
async function handleModals(interaction) {
  if (interaction.customId === 'music_volume_modal') {
    await interaction.deferUpdate();
    let vol = parseInt(interaction.fields.getTextInputValue('music_volume_input')) || 50;
    if (vol < 0) vol = 0;
    if (vol > 100) vol = 100;
    const cfg = ensureConfig(interaction);
    cfg.musicVolume = vol;
    await db.updateGuildConfig(interaction.guildId, { musicVolume: vol });
    interaction.client.guildConfigs.set(interaction.guildId, cfg);
    const { embed, rows } = buildDashboard(interaction);
    return interaction.editReply({ embeds: [embed], components: rows });
  }
}

module.exports = {
  // Entrypoint to render dashboard
  async handleMusic(interaction) {
    const { embed, rows } = buildDashboard(interaction);
    if (interaction.replied || interaction.deferred) {
      return interaction.editReply({ embeds: [embed], components: rows });
    }
    return interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
  },

  // Router for selects/buttons
  async onComponent(interaction) {
    const id = interaction.customId;
    if (id === 'music_channel_select') {
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
