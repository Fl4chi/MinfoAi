// Patch: questa dashboard aggiorna in real-time dopo ogni interazione. Sequenza: deferUpdate > update DB > rebuild config > buildDashboard > editReply
// Refactored: 2025-10-12 - Dashboard giveaway con aggiornamento live immediato
const db = require('../../database/db');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType } = require('discord.js');

// Helper: get channels
function getTextChannels(interaction) {
  try {
    return interaction.guild.channels.cache
      .filter(c => c.type === ChannelType.GuildText)
      .map(c => ({ label: `#${c.name}`, value: c.id }))
      .slice(0, 24);
  } catch (error) {
    console.error('[giveaway] Error fetching channels:', error);
    return [];
  }
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
  
  const durationHours = Math.floor(cfg.giveawayDuration / 3600);
  
  const embed = new EmbedBuilder()
    .setTitle('⚙️ Dashboard Giveaway')
    .setColor(cfg.giveawayEnabled ? '#43B581' : '#ED4245')
    .setDescription(
      `**Sistema:** ${cfg.giveawayEnabled ? '🟢 Attivo' : '🔴 Disattivo'}\n` +
      `**Canale:** ${cfg.giveawayChannelId ? `<#${cfg.giveawayChannelId}>` : 'Nessuno'}\n` +
      `**Durata predefinita:** ${durationHours}h (${cfg.giveawayDuration}s)`
    )
    .setTimestamp();

  const toggleBtn = new ButtonBuilder()
    .setCustomId('giveaway_toggle')
    .setLabel(cfg.giveawayEnabled ? 'Disabilita' : 'Abilita')
    .setStyle(cfg.giveawayEnabled ? 4 : 3)
    .setEmoji(cfg.giveawayEnabled ? '❌' : '✅');

  const durationBtn = new ButtonBuilder()
    .setCustomId('giveaway_set_duration')
    .setLabel('Imposta Durata')
    .setStyle(1)
    .setEmoji('⏰');

  const row1 = new ActionRowBuilder().addComponents(toggleBtn, durationBtn);
  const rows = [row1];

  if (channels.length > 0) {
    const channelMenu = new StringSelectMenuBuilder()
      .setCustomId('giveaway_channel_select')
      .setPlaceholder('Seleziona canale giveaway')
      .addOptions([{ label: 'Nessuno', value: 'none' }, ...channels]);
    rows.push(new ActionRowBuilder().addComponents(channelMenu));
  }

  return { embed, rows };
}

// Handle select menu
async function handleSelect(interaction, channelId) {
  try {
    // PATCH: sempre deferUpdate all'inizio
    await interaction.deferUpdate();

    const newId = channelId === 'none' ? null : channelId;

    // PATCH: update DB prima
    await db.updateGuildConfig(interaction.guildId, { giveawayChannelId: newId });

    // PATCH: rebuild config subito prima del dashboard
    const freshCfg = await db.getGuildConfig(interaction.guildId);
    if (freshCfg) {
      interaction.client.guildConfigs.set(interaction.guildId, freshCfg);
    }

    const { embed, rows } = buildDashboard(interaction);
    // PATCH: usa editReply
    return interaction.editReply({ embeds: [embed], components: rows });
  } catch (error) {
    console.error('[giveaway] Error in handleSelect:', error);
    return interaction.editReply({ content: '❌ Errore durante l\'aggiornamento.', embeds: [], components: [] }).catch(() => {});
  }
}

// Handle buttons
async function handleComponent(interaction) {
  try {
    const id = interaction.customId;

    if (id === 'giveaway_toggle') {
      // PATCH: sempre deferUpdate all'inizio
      await interaction.deferUpdate();
      const cfg = ensureConfig(interaction);
      const newVal = !cfg.giveawayEnabled;

      // PATCH: update DB prima
      await db.updateGuildConfig(interaction.guildId, { giveawayEnabled: newVal });

      // PATCH: rebuild config subito prima del dashboard
      const freshCfg = await db.getGuildConfig(interaction.guildId);
      if (freshCfg) {
        interaction.client.guildConfigs.set(interaction.guildId, freshCfg);
      }

      const { embed, rows } = buildDashboard(interaction);
      // PATCH: usa editReply
      return interaction.editReply({ embeds: [embed], components: rows });
    }

    if (id === 'giveaway_set_duration') {
      const cfg = ensureConfig(interaction);
      const modal = new ModalBuilder()
        .setCustomId('giveaway_duration_modal')
        .setTitle('Imposta Durata Giveaway');

      const input = new TextInputBuilder()
        .setCustomId('duration_value')
        .setLabel('Durata (in secondi)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('86400 (= 24h)')
        .setValue(String(cfg.giveawayDuration || 86400))
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(7);

      const row = new ActionRowBuilder().addComponents(input);
      modal.addComponents(row);
      return interaction.showModal(modal);
    }
  } catch (error) {
    console.error('[giveaway] Error in handleComponent:', error);
    return interaction.reply({ content: '❌ Errore nell\'interazione.', ephemeral: true }).catch(() => {});
  }
}

// Handle modals
async function handleModals(interaction) {
  try {
    const id = interaction.customId;

    if (id === 'giveaway_duration_modal') {
      // PATCH: sempre deferUpdate all'inizio
      await interaction.deferUpdate();
      const duration = parseInt(interaction.fields.getTextInputValue('duration_value'), 10);

      if (isNaN(duration) || duration < 60 || duration > 2592000) {
        return interaction.editReply({ content: '❌ La durata deve essere tra 60 secondi e 2592000 secondi (30 giorni).', embeds: [], components: [] });
      }

      // PATCH: update DB prima
      await db.updateGuildConfig(interaction.guildId, { giveawayDuration: duration });

      // PATCH: rebuild config subito prima del dashboard
      const freshCfg = await db.getGuildConfig(interaction.guildId);
      if (freshCfg) {
        interaction.client.guildConfigs.set(interaction.guildId, freshCfg);
      }

      const { embed, rows } = buildDashboard(interaction);
      // PATCH: usa editReply
      return interaction.editReply({ embeds: [embed], components: rows });
    }
  } catch (error) {
    console.error('[giveaway] Error in handleModals:', error);
    return interaction.editReply({ content: '❌ Errore durante l\'aggiornamento.', embeds: [], components: [] }).catch(() => {});
  }
}

module.exports = {
  // Entrypoint to render dashboard
  async handleGiveaway(interaction) {
    try {
      const { embed, rows } = buildDashboard(interaction);
      if (interaction.replied || interaction.deferred) {
        return interaction.editReply({ embeds: [embed], components: rows });
      }
      return interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
    } catch (error) {
      console.error('[giveaway] Error in handleGiveaway:', error);
      return interaction.reply({ content: '❌ Errore nel caricamento della dashboard.', ephemeral: true }).catch(() => {});
    }
  },
  
  // Router for selects/buttons
  async onComponent(interaction) {
    try {
      const id = interaction.customId;
      if (id === 'giveaway_channel_select') {
        const v = interaction.values?.[0];
        return handleSelect(interaction, v);
      }
      return handleComponent(interaction);
    } catch (error) {
      console.error('[giveaway] Error in onComponent:', error);
      return interaction.reply({ content: '❌ Errore nell\'interazione.', ephemeral: true }).catch(() => {});
    }
  },
  
  // Router for modals
  async onModal(interaction) {
    try {
      return handleModals(interaction);
    } catch (error) {
      console.error('[giveaway] Error in onModal:', error);
      return interaction.reply({ content: '❌ Errore nella gestione del modal.', ephemeral: true }).catch(() => {});
    }
  },

  // Alias for compatibility with setbot.js
  async showPanel(interaction, config) {
    return this.handleGiveaway(interaction);
  }
};
