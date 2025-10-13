// Patch: questa dashboard aggiorna in real-time dopo ogni interazione. Sequenza: deferUpdate > update DB > rebuild config > buildDashboard > editReply
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
    .setTitle('⚙️ Configurazione Music')
    .setColor(cfg.musicEnabled ? '#43B581' : '#ED4245')
    .addFields(
      { name: 'Canale Vocale', value: cfg.musicVoiceChannelId ? `<#${cfg.musicVoiceChannelId}>` : 'Non impostato', inline: false },
      { name: 'Volume', value: `${cfg.musicVolume || 50}%`, inline: true },
      { name: 'Sistema', value: cfg.musicEnabled ? '🟢 ON' : '🔴 OFF', inline: true }
    )
    .setTimestamp();

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
        .setLabel(cfg.musicEnabled ? 'Disabilita' : 'Abilita')
        .setStyle(cfg.musicEnabled ? 4 : 3)
        .setEmoji(cfg.musicEnabled ? '❌' : '✅')
    )
  ];

  return { embed, rows };
}

// Handle select menu
async function handleSelect(interaction, channelId) {
  // PATCH: sempre deferUpdate all'inizio
  await interaction.deferUpdate();
  const cfg = ensureConfig(interaction);
  const newId = channelId === 'none' ? null : channelId;
  cfg.musicVoiceChannelId = newId;
  // PATCH: update DB prima
  await db.updateGuildConfig(interaction.guildId, { musicVoiceChannelId: newId });
  // PATCH: rebuild config subito prima del dashboard
  const freshCfg = await db.getGuildConfig(interaction.guildId);
  if (freshCfg) {
    interaction.client.guildConfigs.set(interaction.guildId, freshCfg);
  }
  const { embed, rows } = buildDashboard(interaction);
  // PATCH: usa editReply
  return interaction.editReply({ embeds: [embed], components: rows });
}

// Handle buttons
async function handleComponent(interaction) {
  const id = interaction.customId;
  const cfg = ensureConfig(interaction);

  if (id === 'music_toggle') {
    // PATCH: sempre deferUpdate all'inizio
    await interaction.deferUpdate();
    const newVal = !cfg.musicEnabled;
    cfg.musicEnabled = newVal;
    // PATCH: update DB prima
    await db.updateGuildConfig(interaction.guildId, { musicEnabled: newVal });
    // PATCH: rebuild config subito prima del dashboard
    const freshCfg = await db.getGuildConfig(interaction.guildId);
    if (freshCfg) {
      interaction.client.guildConfigs.set(interaction.guildId, freshCfg);
    }
    const { embed, rows } = buildDashboard(interaction);
    // PATCH: usa editReply
    return interaction.editReply({ embeds: [embed], components: rows });
  }

  if (id === 'music_set_volume') {
    const modal = new ModalBuilder()
      .setCustomId('music_volume_modal')
      .setTitle('Imposta Volume Musica');
    const input = new TextInputBuilder()
      .setCustomId('volume_value')
      .setLabel('Volume (1-100%)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('50')
      .setValue(String(cfg.musicVolume || 50))
      .setRequired(true)
      .setMinLength(1)
      .setMaxLength(3);
    const row = new ActionRowBuilder().addComponents(input);
    modal.addComponents(row);
    return interaction.showModal(modal);
  }
}

// Handle modals
async function handleModals(interaction) {
  // PATCH: sempre deferUpdate all'inizio
  await interaction.deferUpdate();
  const cfg = ensureConfig(interaction);

  if (interaction.customId === 'music_volume_modal') {
    const volume = parseInt(interaction.fields.getTextInputValue('volume_value'), 10);
    if (isNaN(volume) || volume < 1 || volume > 100) {
      return interaction.editReply({ content: 'Il volume deve essere tra 1 e 100%.', components: [], embeds: [] });
    }
    cfg.musicVolume = volume;
    // PATCH: update DB prima
    await db.updateGuildConfig(interaction.guildId, { musicVolume: volume });
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
  async execute(interaction) { if (typeof this.showPanel==='function') return this.showPanel(interaction); if (typeof this.handleVerification==='function') return this.handleVerification(interaction); return interaction.reply({content: '❌ Dashboard modulo non implementata correttamente!', ephemeral: true}); },

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
  },

  // Alias for compatibility with setbot.js
  async showPanel(interaction, config) {
    return this.handleMusic(interaction);
  }
};
