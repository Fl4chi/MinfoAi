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
  
  const embed = new EmbedBuilder()
    .setTitle('⚙️ Dashboard Gamification')
    .setColor(cfg.gamificationEnabled ? '#43B581' : '#ED4245')
    .setDescription(
      `**Sistema:** ${cfg.gamificationEnabled ? '🟢 Attivo' : '🔴 Disattivo'}\n` +
      `**XP per messaggio:** ${cfg.gamificationXpPerMessage}\n` +
      `**Cooldown XP:** ${cfg.gamificationXpCooldown}s\n` +
      `**Canale Level-Up:** ${cfg.gamificationLevelChannelId ? `<#${cfg.gamificationLevelChannelId}>` : 'Nessuno'}`
    )
    .setTimestamp();

  const toggleBtn = new ButtonBuilder()
    .setCustomId('gamification_toggle')
    .setLabel(cfg.gamificationEnabled ? 'Disabilita' : 'Abilita')
    .setStyle(cfg.gamificationEnabled ? 4 : 3)
    .setEmoji(cfg.gamificationEnabled ? '❌' : '✅');

  const xpBtn = new ButtonBuilder()
    .setCustomId('gamification_set_xp')
    .setLabel('Imposta XP')
    .setStyle(1)
    .setEmoji('🎯');

  const cooldownBtn = new ButtonBuilder()
    .setCustomId('gamification_set_cooldown')
    .setLabel('Imposta Cooldown')
    .setStyle(1)
    .setEmoji('⏱️');

  const row1 = new ActionRowBuilder().addComponents(toggleBtn, xpBtn, cooldownBtn);
  const rows = [row1];

  if (channels.length > 0) {
    const channelMenu = new StringSelectMenuBuilder()
      .setCustomId('gamification_levelup_channel_select')
      .setPlaceholder('Seleziona canale level-up')
      .addOptions([{ label: 'Nessuno', value: 'none' }, ...channels]);
    rows.push(new ActionRowBuilder().addComponents(channelMenu));
  }

  return { embed, rows };
}

// Handle select menu
async function handleSelect(interaction, channelId) {
  // PATCH: sempre deferUpdate all'inizio
  await interaction.deferUpdate();
  const cfg = ensureConfig(interaction);
  const newId = channelId === 'none' ? null : channelId;
  cfg.gamificationLevelChannelId = newId;
  // PATCH: update DB prima
  await db.updateGuildConfig(interaction.guildId, { gamificationLevelChannelId: newId });
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

  if (id === 'gamification_toggle') {
    // PATCH: sempre deferUpdate all'inizio
    await interaction.deferUpdate();
    const newVal = !cfg.gamificationEnabled;
    cfg.gamificationEnabled = newVal;
    // PATCH: update DB prima
    await db.updateGuildConfig(interaction.guildId, { gamificationEnabled: newVal });
    // PATCH: rebuild config subito prima del dashboard
    const freshCfg = await db.getGuildConfig(interaction.guildId);
    if (freshCfg) {
      interaction.client.guildConfigs.set(interaction.guildId, freshCfg);
    }
    const { embed, rows } = buildDashboard(interaction);
    // PATCH: usa editReply
    return interaction.editReply({ embeds: [embed], components: rows });
  }

  if (id === 'gamification_set_xp') {
    const modal = new ModalBuilder()
      .setCustomId('gamification_xp_modal')
      .setTitle('Imposta XP per Messaggio');
    const input = new TextInputBuilder()
      .setCustomId('xp_value')
      .setLabel('XP per messaggio')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('5')
      .setValue(String(cfg.gamificationXpPerMessage || 5))
      .setRequired(true)
      .setMinLength(1)
      .setMaxLength(3);
    const row = new ActionRowBuilder().addComponents(input);
    modal.addComponents(row);
    return interaction.showModal(modal);
  }

  if (id === 'gamification_set_cooldown') {
    const modal = new ModalBuilder()
      .setCustomId('gamification_cooldown_modal')
      .setTitle('Imposta Cooldown XP');
    const input = new TextInputBuilder()
      .setCustomId('cooldown_value')
      .setLabel('Cooldown (secondi)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('60')
      .setValue(String(cfg.gamificationXpCooldown || 60))
      .setRequired(true)
      .setMinLength(1)
      .setMaxLength(4);
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

  if (interaction.customId === 'gamification_xp_modal') {
    const xp = parseInt(interaction.fields.getTextInputValue('xp_value'), 10);
    if (isNaN(xp) || xp < 1 || xp > 100) {
      return interaction.editReply({ content: 'L\'XP deve essere tra 1 e 100.', components: [], embeds: [] });
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
      return interaction.editReply({ content: 'Il cooldown deve essere tra 0 e 3600 secondi.', components: [], embeds: [] });
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
  async execute(interaction) { if (typeof this.showPanel==='function') return this.showPanel(interaction); if (typeof this.handleVerification==='function') return this.handleVerification(interaction); return interaction.reply({content: '❌ Dashboard modulo non implementata correttamente!', ephemeral: true}); },

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
    if (id === 'gamification_levelup_channel_select') {
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
    return this.handleGamification(interaction);
  }
};
