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
    .setTitle('⚙️ Dashboard Moderazione')
    .setColor(cfg.moderationEnabled ? '#43B581' : '#ED4245')
    .setDescription(
      `**Sistema:** ${cfg.moderationEnabled ? '🟢 Attivo' : '🔴 Disattivo'}\n` +
      `**Canale Log:** ${cfg.moderationLogChannelId ? `<#${cfg.moderationLogChannelId}>` : 'Nessuno'}\n` +
      `**Automod:** ${cfg.moderationAutomodEnabled ? '✅ Attivo' : '❌ Disattivo'}`
    )
    .setTimestamp();

  const toggleBtn = new ButtonBuilder()
    .setCustomId('moderation_toggle')
    .setLabel(cfg.moderationEnabled ? 'Disabilita' : 'Abilita')
    .setStyle(cfg.moderationEnabled ? 4 : 3)
    .setEmoji(cfg.moderationEnabled ? '❌' : '✅');

  const automodBtn = new ButtonBuilder()
    .setCustomId('moderation_toggle_automod')
    .setLabel(cfg.moderationAutomodEnabled ? 'Disabilita Automod' : 'Abilita Automod')
    .setStyle(cfg.moderationAutomodEnabled ? 4 : 1)
    .setEmoji('🤖');

  const row1 = new ActionRowBuilder().addComponents(toggleBtn, automodBtn);
  const rows = [row1];

  if (channels.length > 0) {
    const channelMenu = new StringSelectMenuBuilder()
      .setCustomId('moderation_channel_log_select')
      .setPlaceholder('Seleziona canale log')
      .addOptions([{ label: 'Nessuno', value: 'none' }, ...channels]);
    rows.push(new ActionRowBuilder().addComponents(channelMenu));
  }

  return { embed, rows };
}

// Handle select menu
async function handleSelect(interaction, action) {
  if (action === 'moderation_toggle') {
    // PATCH: sempre deferUpdate all'inizio
    await interaction.deferUpdate();
    const cfg = ensureConfig(interaction);
    const newVal = !cfg.moderationEnabled;
    cfg.moderationEnabled = newVal;

    // PATCH: update DB prima
    await db.updateGuildConfig(interaction.guildId, { moderationEnabled: newVal });

    // PATCH: rebuild config subito prima del dashboard
    const freshCfg = await db.getGuildConfig(interaction.guildId);
    if (freshCfg) {
      interaction.client.guildConfigs.set(interaction.guildId, freshCfg);
    }

    const { embed, rows } = buildDashboard(interaction);
    // PATCH: usa editReply
    return interaction.editReply({ embeds: [embed], components: rows });
  }

  if (action === 'moderation_toggle_automod') {
    // PATCH: sempre deferUpdate all'inizio
    await interaction.deferUpdate();
    const cfg = ensureConfig(interaction);
    const newVal = !cfg.moderationAutomodEnabled;
    cfg.moderationAutomodEnabled = newVal;

    // PATCH: update DB prima
    await db.updateGuildConfig(interaction.guildId, { moderationAutomodEnabled: newVal });

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

// Handle buttons
async function handleComponent(interaction) {
  const id = interaction.customId;

  if (id === 'moderation_toggle') {
    return handleSelect(interaction, 'moderation_toggle');
  }

  if (id === 'moderation_toggle_automod') {
    return handleSelect(interaction, 'moderation_toggle_automod');
  }

  if (id === 'moderation_channel_log_select') {
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
  },

  // Alias for compatibility with setbot.js
  async showPanel(interaction, config) {
    return this.handleModeration(interaction);
  }
};
