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
    .setTitle('⚙️ Configurazione: Gamification')
    .setColor(cfg.gamificationEnabled ? '#43B581' : '#ED4245')
    .addFields(
      { name: 'Canale Livelli', value: cfg.gamificationLevelChannelId ? `<#${cfg.gamificationLevelChannelId}>` : 'Non impostato', inline: false },
      { name: 'XP per Messaggio', value: `${cfg.gamificationXpPerMessage || 5}`, inline: true },
      { name: 'Cooldown (sec)', value: `${cfg.gamificationXpCooldown || 60}`, inline: true },
      { name: 'Sistema', value: cfg.gamificationEnabled ? '🟢 ON' : '🔴 OFF', inline: false }
    );

  const rows = [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('gamification_channel_select')
        .setPlaceholder(cfg.gamificationLevelChannelId ? 'Canale impostato' : 'Seleziona canale livelli')
        .addOptions([{ label: 'Nessuno', value: 'none' }, ...channels])
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('gamification_set_xp')
        .setLabel('Imposta XP')
        .setStyle(1)
        .setEmoji('⭐'),
      new ButtonBuilder()
        .setCustomId('gamification_set_cooldown')
        .setLabel('Imposta Cooldown')
        .setStyle(1)
        .setEmoji('⏱️'),
      new ButtonBuilder()
        .setCustomId('gamification_toggle')
        .setLabel(cfg.gamificationEnabled ? 'Disattiva' : 'Attiva')
        .setStyle(cfg.gamificationEnabled ? 4 : 3)
    )
  ];

  return { embed, rows };
}

// Handle select menu changes
async function handleSelect(interaction, value) {
  await interaction.deferUpdate();
  const cfg = ensureConfig(interaction);
  const newVal = value === 'none' ? null : value;
  cfg.gamificationLevelChannelId = newVal;
  await db.updateGuildConfig(interaction.guildId, { gamificationLevelChannelId: newVal });
  interaction.client.guildConfigs.set(interaction.guildId, cfg);
  const { embed, rows } = buildDashboard(interaction);
  return interaction.editReply({ embeds: [embed], components: rows });
}

// Handle button clicks
async function handleComponent(interaction) {
  const id = interaction.customId;
  
  if (id === 'gamification_toggle') {
    await interaction.deferUpdate();
    const cfg = ensureConfig(interaction);
    cfg.gamificationEnabled = !cfg.gamificationEnabled;
    await db.updateGuildConfig(interaction.guildId, { gamificationEnabled: cfg.gamificationEnabled });
    interaction.client.guildConfigs.set(interaction.guildId, cfg);
    const { embed, rows } = buildDashboard(interaction);
    return interaction.editReply({ embeds: [embed], components: rows });
  }

  if (id === 'gamification_set_xp') {
    const modal = new ModalBuilder()
      .setCustomId('gamification_xp_modal')
      .setTitle('Imposta XP per Messaggio');
    const input = new TextInputBuilder()
      .setCustomId('gamification_xp_input')
      .setLabel('XP per messaggio (numero)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('5')
      .setRequired(true)
      .setValue(String(ensureConfig(interaction).gamificationXpPerMessage || 5));
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    return interaction.showModal(modal);
  }

  if (id === 'gamification_set_cooldown') {
    const modal = new ModalBuilder()
      .setCustomId('gamification_cooldown_modal')
      .setTitle('Imposta Cooldown XP');
    const input = new TextInputBuilder()
      .setCustomId('gamification_cooldown_input')
      .setLabel('Cooldown in secondi')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('60')
      .setRequired(true)
      .setValue(String(ensureConfig(interaction).gamificationXpCooldown || 60));
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    return interaction.showModal(modal);
  }
}

// Handle modal submits
async function handleModals(interaction) {
  if (interaction.customId === 'gamification_xp_modal') {
    await interaction.deferUpdate();
    const xp = parseInt(interaction.fields.getTextInputValue('gamification_xp_input')) || 5;
    const cfg = ensureConfig(interaction);
    cfg.gamificationXpPerMessage = xp;
    await db.updateGuildConfig(interaction.guildId, { gamificationXpPerMessage: xp });
    interaction.client.guildConfigs.set(interaction.guildId, cfg);
    const { embed, rows } = buildDashboard(interaction);
    return interaction.editReply({ embeds: [embed], components: rows });
  }

  if (interaction.customId === 'gamification_cooldown_modal') {
    await interaction.deferUpdate();
    const cd = parseInt(interaction.fields.getTextInputValue('gamification_cooldown_input')) || 60;
    const cfg = ensureConfig(interaction);
    cfg.gamificationXpCooldown = cd;
    await db.updateGuildConfig(interaction.guildId, { gamificationXpCooldown: cd });
    interaction.client.guildConfigs.set(interaction.guildId, cfg);
    const { embed, rows } = buildDashboard(interaction);
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
    if (id === 'gamification_channel_select') {
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
