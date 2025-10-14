// Patch: Giveaway dashboard ottimizzato - solo select menu canale, preview embed con stato/canale/variabili principali
// Nessun bottone extra, gestisce errori e salva in DB
const db = require('../../database/db');
const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ChannelType
} = require('discord.js');

// Helpers
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

// Build dashboard embed with status, channel, and main variables
function buildDashboard(interaction) {
  const cfg = ensureConfig(interaction);
  const channels = getTextChannels(interaction);

  // Stato
  const statusText = cfg.giveawayEnabled ? '✅ Attivo' : '❌ Disattivo';
  
  // Canale
  let channelText = '❌ Non impostato';
  if (cfg.giveawayChannelId) {
    const ch = interaction.guild.channels.cache.get(cfg.giveawayChannelId);
    channelText = ch ? `✅ <#${cfg.giveawayChannelId}>` : '⚠️ Canale non trovato';
  }

  // Durata
  const durationHours = Math.floor(cfg.giveawayDuration / 3600);
  const durationText = `⏰ ${durationHours} ore`;

  // Embed preview
  const embed = new EmbedBuilder()
    .setTitle('🎉 Configurazione Giveaway')
    .setColor('#5865F2')
    .setDescription(
      `**Stato:** ${statusText}\n` +
      `**Canale:** ${channelText}\n` +
      `**Durata:** ${durationText}\n\n` +
      `Seleziona il canale per i giveaway dal menu sottostante.`
    )
    .setTimestamp();

  // Select menu per canale giveaway
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('giveaway_channel_select')
    .setPlaceholder('Seleziona canale giveaway')
    .addOptions(channels.length > 0 ? channels : [
      { label: 'Nessun canale disponibile', value: 'none' }
    ]);

  const row = new ActionRowBuilder().addComponents(selectMenu);

  return { embed, rows: [row] };
}

// Handle select menu
async function handleSelect(interaction, channelId) {
  try {
    await interaction.deferUpdate().catch(() => {});

    if (channelId === 'none') {
      return interaction.editReply({
        content: '❌ Nessun canale disponibile.',
        embeds: [],
        components: []
      }).catch(() => {});
    }

    const cfg = ensureConfig(interaction);
    cfg.giveawayChannelId = channelId;
    cfg.giveawayEnabled = true;

    // Salva in database
    try {
      await db.query(
        `UPDATE guild_configs SET giveaway_enabled = ?, giveaway_channel_id = ? WHERE guild_id = ?`,
        [cfg.giveawayEnabled, cfg.giveawayChannelId, cfg.guildId]
      );
      console.log(`[giveaway] Saved config for guild ${cfg.guildId}`);
    } catch (dbError) {
      console.error('[giveaway] Database save error:', dbError);
      return interaction.editReply({
        content: '❌ Errore nel salvataggio della configurazione.',
        embeds: [],
        components: []
      }).catch(() => {});
    }

    // Rebuild dashboard
    interaction.client.guildConfigs.set(interaction.guildId, cfg);
    const { embed, rows } = buildDashboard(interaction);
    
    return interaction.editReply({
      embeds: [embed],
      components: rows
    }).catch(error => {
      console.error('[giveaway] Error updating dashboard:', error);
    });
  } catch (error) {
    console.error('[giveaway] Error in handleSelect:', error);
    return interaction.editReply({
      content: '❌ Errore durante l\'aggiornamento.',
      embeds: [],
      components: []
    }).catch(() => {});
  }
}

module.exports = {
  // Entry point to render dashboard
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
  // Router for selects
  async onComponent(interaction) {
    try {
      const id = interaction.customId;
      if (id === 'giveaway_channel_select') {
        const v = interaction.values?.[0];
        return handleSelect(interaction, v);
      }
      // Fallback
      return interaction.reply({ content: '❌ Interazione non riconosciuta.', ephemeral: true }).catch(() => {});
    } catch (error) {
      console.error('[giveaway] Error in onComponent:', error);
      return interaction.reply({ content: '❌ Errore nell\'interazione.', ephemeral: true }).catch(() => {});
    }
  },
  // Alias for compatibility with setbot.js
  async showPanel(interaction, config) {
    return this.handleGiveaway(interaction);
  }
};
