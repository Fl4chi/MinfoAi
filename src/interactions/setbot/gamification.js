// Patch: questa dashboard aggiorna in real-time dopo ogni interazione. Sequenza: deferUpdate > update DB > rebuild config > buildDashboard > editReply
// Refactored: 2025-10-12 - Dashboard gamification con aggiornamento live immediato
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
      gamificationEnabled: false,
      gamificationXpPerMessage: 5,
      gamificationXpCooldown: 60,
      gamificationLevelChannelId: null
    };
    interaction.client.guildConfigs.set(interaction.guildId, cfg);
  }
  if (cfg.gamificationXpPerMessage === undefined) cfg.gamificationXpPerMessage = 5;
  if (cfg.gamificationXpCooldown === undefined) cfg.gamificationXpCooldown = 60;
  return cfg;
}

// Build dashboard embed + components
function buildDashboard(interaction) {
  const cfg = ensureConfig(interaction);
  const channels = getTextChannels(interaction);

  const enabled = cfg.gamificationEnabled || false;
  const xp = cfg.gamificationXpPerMessage || 5;
  const cooldown = cfg.gamificationXpCooldown || 60;
  const channelName = cfg.gamificationLevelChannelId
    ? `<#${cfg.gamificationLevelChannelId}>`
    : 'Nessun canale';

  const embed = new EmbedBuilder()
    .setTitle('⚙️ Configurazione Gamification')
    .setColor(0x00ff00)
    .setDescription(
      `**Status:** ${enabled ? '✅ Abilitato' : '❌ Disabilitato'}\n` +
      `**XP per Messaggio:** ${xp}\n` +
      `**Cooldown (sec):** ${cooldown}\n` +
      `**Canale Livelli:** ${channelName}`
    )
    .setTimestamp();

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('gamification_config_select')
    .setPlaceholder('Seleziona configurazione')
    .addOptions(
      { label: 'Canale Livelli', value: 'channel_level', emoji: '📢' },
      { label: 'XP per Messaggio', value: 'xp_message', emoji: '🎯' },
      { label: 'Cooldown XP', value: 'cooldown_xp', emoji: '⏱️' }
    );

  const row1 = new ActionRowBuilder().addComponents(selectMenu);
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('gamification_toggle')
      .setLabel(enabled ? 'Disabilita' : 'Abilita')
      .setStyle(enabled ? 4 : 3)
  );

  return { embed, rows: [row1, row2] };
}

// Handle select menu
async function handleSelect(interaction, value) {
  // PATCH: sempre deferUpdate all'inizio
  await interaction.deferUpdate();
  const cfg = ensureConfig(interaction);

  if (value === 'channel_level') {
    const channels = getTextChannels(interaction);
    if (channels.length === 0) {
      return interaction.editReply({ content: 'Nessun canale testuale disponibile.', components: [], embeds: [] });
    }
    const select = new StringSelectMenuBuilder()
      .setCustomId('gamification_channel_level_select')
      .setPlaceholder('Scegli canale livelli')
      .addOptions(channels);
    const row = new ActionRowBuilder().addComponents(select);
    return interaction.editReply({ content: 'Seleziona il canale per i livelli:', components: [row], embeds: [] });
  }

  if (value === 'xp_message') {
    const modal = new ModalBuilder()
      .setCustomId('gamification_xp_modal')
      .setTitle('XP per Messaggio');
    const input = new TextInputBuilder()
      .setCustomId('xp_value')
      .setLabel('XP per Messaggio (es: 5)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setValue(String(cfg.gamificationXpPerMessage || 5));
    const row = new ActionRowBuilder().addComponents(input);
    modal.addComponents(row);
    return interaction.showModal(modal);
  }

  if (value === 'cooldown_xp') {
    const modal = new ModalBuilder()
      .setCustomId('gamification_cooldown_modal')
      .setTitle('Cooldown XP');
    const input = new TextInputBuilder()
      .setCustomId('cooldown_value')
      .setLabel('Cooldown in secondi (es: 60)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setValue(String(cfg.gamificationXpCooldown || 60));
    const row = new ActionRowBuilder().addComponents(input);
    modal.addComponents(row);
    return interaction.showModal(modal);
  }

  const { embed, rows } = buildDashboard(interaction);
  return interaction.editReply({ embeds: [embed], components: rows });
}

// Handle button
async function handleComponent(interaction) {
  if (interaction.customId === 'gamification_toggle') {
    // PATCH: sempre deferUpdate all'inizio
    await interaction.deferUpdate();
    const cfg = ensureConfig(interaction);
    cfg.gamificationEnabled = !cfg.gamificationEnabled;

    // PATCH: update DB prima
    await db.updateGuildConfig(interaction.guildId, { gamificationEnabled: cfg.gamificationEnabled });

    // PATCH: rebuild config subito prima del dashboard
    const freshCfg = await db.getGuildConfig(interaction.guildId);
    if (freshCfg) {
      interaction.client.guildConfigs.set(interaction.guildId, freshCfg);
    }

    const { embed, rows } = buildDashboard(interaction);
    // PATCH: usa editReply
    return interaction.editReply({ embeds: [embed], components: rows });
  }

  if (interaction.customId === 'gamification_channel_level_select') {
    // PATCH: sempre deferUpdate all'inizio
    await interaction.deferUpdate();
    const cfg = ensureConfig(interaction);
    const channelId = interaction.values?.[0];
    cfg.gamificationLevelChannelId = channelId;

    // PATCH: update DB prima
    await db.updateGuildConfig(interaction.guildId, { gamificationLevelChannelId: channelId });

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

// Handle modals
async function handleModals(interaction) {
  // PATCH: sempre deferUpdate all'inizio
  await interaction.deferUpdate();
  const cfg = ensureConfig(interaction);

  if (interaction.customId === 'gamification_xp_modal') {
    const xp = parseInt(interaction.fields.getTextInputValue('xp_value'), 10);
    if (isNaN(xp) || xp < 1 || xp > 100) {
      return interaction.editReply({ content: 'XP deve essere tra 1 e 100.', components: [], embeds: [] });
    }
    cfg.gamificationXpPerMessage = xp;

    // PATCH: update DB prima
    await db.updateGuildConfig(interaction.guildId, { gamificationXpPerMessage: xp });

    // PATCH: rebuild config subito prima del dashboard
    const freshCfg = await db.getGuildConfig(interaction.guildId);
    if (freshCfg) {
      interaction.client.guildConfigs.set(interaction.guildId, freshCfg);
    }

    const { embed, rows } = buildDashboard(interaction);
    // PATCH: usa editReply
    return interaction.editReply({ embeds: [embed], components: rows });
  }

  if (interaction.customId === 'gamification_cooldown_modal') {
    const cooldown = parseInt(interaction.fields.getTextInputValue('cooldown_value'), 10);
    if (isNaN(cooldown) || cooldown < 0 || cooldown > 3600) {
      return interaction.editReply({ content: 'Cooldown deve essere tra 0 e 3600 sec.', components: [], embeds: [] });
    }
    cfg.gamificationXpCooldown = cooldown;

    // PATCH: update DB prima
    await db.updateGuildConfig(interaction.guildId, { gamificationXpCooldown: cooldown });

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
  async handleGamification(interaction) {
    const { embed, rows } = buildDashboard(interaction);
    if (interaction.replied || interaction.deferred) {
      return interaction.editReply({ embeds: [embed], components: rows });
    }
    return interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
  },

  // Router for selects/buttons
  async onComponent(interaction) {
    const id = interaction.customId;
    if (id === 'gamification_config_select') {
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
