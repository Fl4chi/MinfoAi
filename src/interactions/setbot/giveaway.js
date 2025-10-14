// Giveaway dashboard con UI aggiornata: select canale + 4 bottoni (On/Off, Ripristina, Messaggio, Anteprima)
// Live preview embed, gestione variabili immediata, nessun bottone in home. Error handling robusto, codice pulito.

const db = require('../../database/db');
const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
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
      giveawayDuration: 86400,
      giveawayMessage: 'Reagisci per partecipare! 🎉',
    };
    interaction.client.guildConfigs.set(interaction.guildId, cfg);
  }
  if (cfg.giveawayDuration === undefined) cfg.giveawayDuration = 86400;
  if (!cfg.giveawayMessage) cfg.giveawayMessage = 'Reagisci per partecipare! 🎉';
  return cfg;
}

async function saveConfig(cfg) {
  try {
    await db.query(
      'INSERT INTO guild_configs (guild_id, giveaway_enabled, giveaway_channel_id, giveaway_duration, giveaway_message) VALUES (?, ?, ?, ?, ?) \
       ON DUPLICATE KEY UPDATE giveaway_enabled=VALUES(giveaway_enabled), giveaway_channel_id=VALUES(giveaway_channel_id), giveaway_duration=VALUES(giveaway_duration), giveaway_message=VALUES(giveaway_message)'
      , [cfg.guildId, cfg.giveawayEnabled, cfg.giveawayChannelId, cfg.giveawayDuration, cfg.giveawayMessage]);
    return true;
  } catch (err) {
    console.error('[giveaway] saveConfig error:', err);
    return false;
  }
}

// Build dashboard embed + components
function buildDashboard(interaction) {
  const cfg = ensureConfig(interaction);
  const channels = getTextChannels(interaction);

  const statusText = cfg.giveawayEnabled ? '✅ Attivo' : '❌ Disattivo';

  let channelText = '❌ Non impostato';
  if (cfg.giveawayChannelId) {
    const ch = interaction.guild.channels.cache.get(cfg.giveawayChannelId);
    channelText = ch ? `✅ <#${cfg.giveawayChannelId}>` : '⚠️ Canale non trovato';
  }

  const durationHours = Math.floor((cfg.giveawayDuration || 0) / 3600);
  const durationText = `⏰ ${durationHours} ore`;

  const embed = new EmbedBuilder()
    .setTitle('🎉 Configurazione Giveaway')
    .setColor(cfg.giveawayEnabled ? 0x57F287 : 0xED4245)
    .setDescription(
      `**Stato:** ${statusText}\n` +
      `**Canale:** ${channelText}\n` +
      `**Durata:** ${durationText}\n` +
      `**Messaggio:** ${cfg.giveawayMessage}\n\n` +
      `Seleziona il canale e usa i bottoni per gestire lo stato e il messaggio.`
    )
    .setTimestamp();

  // Select menu canale
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('giveaway_channel_select')
    .setPlaceholder('Seleziona canale giveaway')
    .addOptions(channels.length > 0 ? channels : [
      { label: 'Nessun canale disponibile', value: 'none' }
    ]);

  const selectRow = new ActionRowBuilder().addComponents(selectMenu);

  // 4 bottoni sotto al menu select
  const buttonsRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('giveaway_toggle')
      .setStyle(cfg.giveawayEnabled ? ButtonStyle.Danger : ButtonStyle.Success)
      .setLabel(cfg.giveawayEnabled ? 'Off' : 'On'),
    new ButtonBuilder()
      .setCustomId('giveaway_reset')
      .setStyle(ButtonStyle.Secondary)
      .setLabel('Ripristina'),
    new ButtonBuilder()
      .setCustomId('giveaway_message')
      .setStyle(ButtonStyle.Primary)
      .setLabel('Messaggio'),
    new ButtonBuilder()
      .setCustomId('giveaway_preview')
      .setStyle(ButtonStyle.Secondary)
      .setLabel('Anteprima')
  );

  return { embed, rows: [selectRow, buttonsRow] };
}

// Component handlers
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
    interaction.client.guildConfigs.set(interaction.guildId, cfg);
    const ok = await saveConfig(cfg);
    if (!ok) {
      return interaction.editReply({ content: '❌ Errore nel salvataggio configurazione.', embeds: [], components: [] }).catch(() => {});
    }
    const { embed, rows } = buildDashboard(interaction);
    return interaction.editReply({ embeds: [embed], components: rows }).catch(err => console.error('[giveaway] update after select:', err));
  } catch (error) {
    console.error('[giveaway] handleSelect:', error);
    return interaction.editReply({ content: '❌ Errore durante aggiornamento.', embeds: [], components: [] }).catch(() => {});
  }
}

async function handleToggle(interaction) {
  try {
    await interaction.deferUpdate().catch(() => {});
    const cfg = ensureConfig(interaction);
    cfg.giveawayEnabled = !cfg.giveawayEnabled;
    interaction.client.guildConfigs.set(interaction.guildId, cfg);
    const ok = await saveConfig(cfg);
    if (!ok) return interaction.editReply({ content: '❌ Errore salvataggio.', embeds: [], components: [] }).catch(() => {});
    const { embed, rows } = buildDashboard(interaction);
    return interaction.editReply({ embeds: [embed], components: rows });
  } catch (e) {
    console.error('[giveaway] handleToggle:', e);
    return interaction.editReply({ content: '❌ Errore toggle.', embeds: [], components: [] }).catch(() => {});
  }
}

async function handleReset(interaction) {
  try {
    await interaction.deferUpdate().catch(() => {});
    const cfg = ensureConfig(interaction);
    cfg.giveawayEnabled = false;
    cfg.giveawayChannelId = null;
    cfg.giveawayDuration = 86400;
    cfg.giveawayMessage = 'Reagisci per partecipare! 🎉';
    interaction.client.guildConfigs.set(interaction.guildId, cfg);
    const ok = await saveConfig(cfg);
    if (!ok) return interaction.editReply({ content: '❌ Errore salvataggio.', embeds: [], components: [] }).catch(() => {});
    const { embed, rows } = buildDashboard(interaction);
    return interaction.editReply({ embeds: [embed], components: rows });
  } catch (e) {
    console.error('[giveaway] handleReset:', e);
    return interaction.editReply({ content: '❌ Errore ripristino.', embeds: [], components: [] }).catch(() => {});
  }
}

async function handleMessageModal(interaction) {
  const cfg = ensureConfig(interaction);
  const modal = new ModalBuilder()
    .setCustomId('giveaway_message_modal')
    .setTitle('Messaggio Giveaway');
  const input = new TextInputBuilder()
    .setCustomId('giveaway_message_input')
    .setLabel('Testo messaggio')
    .setStyle(TextInputStyle.Paragraph)
    .setMaxLength(1024)
    .setRequired(true)
    .setValue(cfg.giveawayMessage || '');
  modal.addComponents(new ActionRowBuilder().addComponents(input));
  return interaction.showModal(modal).catch(err => console.error('[giveaway] showModal:', err));
}

async function handleMessageSubmit(interaction) {
  try {
    const value = interaction.fields.getTextInputValue('giveaway_message_input')?.trim();
    const cfg = ensureConfig(interaction);
    if (value) cfg.giveawayMessage = value;
    interaction.client.guildConfigs.set(interaction.guildId, cfg);
    const ok = await saveConfig(cfg);
    const { embed, rows } = buildDashboard(interaction);
    if (!ok) return interaction.reply({ content: '❌ Errore salvataggio.', ephemeral: true }).catch(() => {});
    // live update if possible
    if (interaction.message) {
      return interaction.update({ embeds: [embed], components: rows }).catch(() => interaction.reply({ embeds: [embed], components: rows, ephemeral: true }).catch(() => {}));
    }
    return interaction.reply({ embeds: [embed], components: rows, ephemeral: true }).catch(() => {});
  } catch (e) {
    console.error('[giveaway] handleMessageSubmit:', e);
    return interaction.reply({ content: '❌ Errore invio messaggio.', ephemeral: true }).catch(() => {});
  }
}

async function handlePreview(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true }).catch(() => {});
    const cfg = ensureConfig(interaction);
    const preview = new EmbedBuilder()
      .setTitle('🎁 Giveaway Preview')
      .setColor(0x5865F2)
      .setDescription(cfg.giveawayMessage)
      .addFields(
        { name: 'Stato', value: cfg.giveawayEnabled ? 'Attivo' : 'Disattivo', inline: true },
        { name: 'Canale', value: cfg.giveawayChannelId ? `<#${cfg.giveawayChannelId}>` : 'Non impostato', inline: true },
        { name: 'Durata', value: `${Math.floor((cfg.giveawayDuration || 0)/3600)} ore`, inline: true },
      )
      .setTimestamp();
    return interaction.editReply({ embeds: [preview] }).catch(() => {});
  } catch (e) {
    console.error('[giveaway] handlePreview:', e);
    return interaction.reply({ content: '❌ Errore anteprima.', ephemeral: true }).catch(() => {});
  }
}

module.exports = {
  // Render panel
  async handleGiveaway(interaction) {
    try {
      const { embed, rows } = buildDashboard(interaction);
      if (interaction.replied || interaction.deferred) {
        return interaction.editReply({ embeds: [embed], components: rows });
      }
      return interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
    } catch (error) {
      console.error('[giveaway] handleGiveaway:', error);
      return interaction.reply({ content: '❌ Errore nel caricamento della dashboard.', ephemeral: true }).catch(() => {});
    }
  },

  // Component router (selects + buttons)
  async onComponent(interaction) {
    try {
      const id = interaction.customId;
      if (id === 'giveaway_channel_select') {
        const v = interaction.values?.[0];
        return handleSelect(interaction, v);
      }
      if (id === 'giveaway_toggle') return handleToggle(interaction);
      if (id === 'giveaway_reset') return handleReset(interaction);
      if (id === 'giveaway_message') return handleMessageModal(interaction);
      if (id === 'giveaway_preview') return handlePreview(interaction);
      return interaction.reply({ content: '❌ Interazione non riconosciuta.', ephemeral: true }).catch(() => {});
    } catch (error) {
      console.error('[giveaway] onComponent:', error);
      return interaction.reply({ content: '❌ Errore nell\'interazione.', ephemeral: true }).catch(() => {});
    }
  },

  // Modal submit router
  async onModalSubmit(interaction) {
    try {
      if (interaction.customId === 'giveaway_message_modal') {
        return handleMessageSubmit(interaction);
      }
      return interaction.reply({ content: '❌ Modal non riconosciuta.', ephemeral: true }).catch(() => {});
    } catch (e) {
      console.error('[giveaway] onModalSubmit:', e);
      return interaction.reply({ content: '❌ Errore gestione modal.', ephemeral: true }).catch(() => {});
    }
  },

  // Alias for compatibility with setbot.js
  async showPanel(interaction, config) {
    return this.handleGiveaway(interaction);
  }
};
