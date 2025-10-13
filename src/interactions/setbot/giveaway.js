// Patch: Giveaway dashboard with real-time embed customization (color, title, description, image, footer) and live preview
// Style aligned with welcome.js. Flow: deferUpdate > update DB > rebuild config > buildDashboard > editReply

const db = require('../../database/db');
const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
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
      giveawayDuration: 86400,
      // Embed defaults (mirroring welcome.js style keys)
      giveawayEmbedColor: '#5865F2',
      giveawayEmbedTitle: '🎉 Giveaway!',
      giveawayEmbedDescription: 'Partecipa reagendo con 🎉 per entrare!',
      giveawayEmbedImage: '',
      giveawayEmbedFooter: 'Buona fortuna!'
    };
    interaction.client.guildConfigs.set(interaction.guildId, cfg);
  }
  if (cfg.giveawayDuration === undefined) cfg.giveawayDuration = 86400;
  // Ensure embed keys exist for older configs
  if (!('giveawayEmbedColor' in cfg)) cfg.giveawayEmbedColor = '#5865F2';
  if (!('giveawayEmbedTitle' in cfg)) cfg.giveawayEmbedTitle = '🎉 Giveaway!';
  if (!('giveawayEmbedDescription' in cfg)) cfg.giveawayEmbedDescription = 'Partecipa reagendo con 🎉 per entrare!';
  if (!('giveawayEmbedImage' in cfg)) cfg.giveawayEmbedImage = '';
  if (!('giveawayEmbedFooter' in cfg)) cfg.giveawayEmbedFooter = 'Buona fortuna!';
  return cfg;
}

// Build the embed preview from config
function buildEmbedFromConfig(cfg, interaction) {
  const embed = new EmbedBuilder();
  // Color: support hex string or number
  try {
    const color = typeof cfg.giveawayEmbedColor === 'string' && cfg.giveawayEmbedColor.startsWith('#')
      ? parseInt(cfg.giveawayEmbedColor.replace('#', ''), 16)
      : (typeof cfg.giveawayEmbedColor === 'number' ? cfg.giveawayEmbedColor : 0x5865F2);
    embed.setColor(color);
  } catch (_) {
    embed.setColor(0x5865F2);
  }
  if (cfg.giveawayEmbedTitle) embed.setTitle(String(cfg.giveawayEmbedTitle).slice(0, 256));
  if (cfg.giveawayEmbedDescription) embed.setDescription(String(cfg.ggiveawayEmbedDescription || cfg.giveawayEmbedDescription).slice(0, 4000));
  if (cfg.giveawayEmbedImage) embed.setImage(String(cfg.giveawayEmbedImage));
  const footerTxt = cfg.giveawayEmbedFooter ? String(cfg.giveawayEmbedFooter).slice(0, 2048) : undefined;
  if (footerTxt) embed.setFooter({ text: footerTxt });
  embed.setTimestamp(new Date());
  try {
    embed.setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL({ size: 128 }) || undefined });
  } catch (_) {}
  return embed;
}

// Component builders
function buildDashboard(interaction) {
  const cfg = ensureConfig(interaction);

  const embed = buildEmbedFromConfig(cfg, interaction);

  const channelRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('giveaway_channel_select')
      .setPlaceholder(cfg.giveawayChannelId ? `Canale attuale: #${interaction.guild.channels.cache.get(cfg.giveawayChannelId)?.name || 'unknown'}` : 'Seleziona canale giveaway')
      .addOptions(getTextChannels(interaction))
  );

  const primaryRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('giveaway_toggle').setStyle(3).setLabel(cfg.giveawayEnabled ? 'Disattiva' : 'Attiva'),
    new ButtonBuilder().setCustomId('giveaway_duration').setStyle(1).setLabel('Durata'),
    new ButtonBuilder().setCustomId('giveaway_preview_send').setStyle(2).setLabel('Invia Preview')
  );

  // Embed customization controls (mirroring welcome.js)
  const embedRow1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('gw_embed_color').setStyle(1).setLabel('Colore'),
    new ButtonBuilder().setCustomId('gw_embed_title').setStyle(1).setLabel('Titolo'),
    new ButtonBuilder().setCustomId('gw_embed_desc').setStyle(1).setLabel('Descrizione')
  );

  const embedRow2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('gw_embed_image').setStyle(1).setLabel('Immagine'),
    new ButtonBuilder().setCustomId('gw_embed_footer').setStyle(1).setLabel('Footer'),
    new ButtonBuilder().setCustomId('gw_embed_reset').setStyle(4).setLabel('Reset')
  );

  return { embed, rows: [channelRow, primaryRow, embedRow1, embedRow2] };
}

// Persist helpers
async function updateConfig(guildId, patch) {
  try {
    await db.updateGuildConfig(guildId, patch);
  } catch (e) {
    console.error('[giveaway] DB update error:', e);
  }
}

async function rebuildAndRefresh(interaction) {
  // reload latest from DB into memory, then refresh UI
  const fresh = await db.getGuildConfig(interaction.guildId).catch(() => null);
  if (fresh) interaction.client.guildConfigs.set(interaction.guildId, fresh);
  const { embed, rows } = buildDashboard(interaction);
  return interaction.editReply({ embeds: [embed], components: rows });
}

// Component routing
async function handleSelect(interaction, value) {
  await interaction.deferUpdate().catch(() => {});
  await updateConfig(interaction.guildId, { giveawayChannelId: value });
  return rebuildAndRefresh(interaction);
}

async function handleComponent(interaction) {
  const id = interaction.customId;
  await interaction.deferUpdate().catch(() => {});
  const cfg = ensureConfig(interaction);

  if (id === 'giveaway_toggle') {
    await updateConfig(interaction.guildId, { giveawayEnabled: !cfg.giveawayEnabled });
    return rebuildAndRefresh(interaction);
  }

  if (id === 'giveaway_duration') {
    const modal = new ModalBuilder()
      .setCustomId('modal_gw_duration')
      .setTitle('Imposta durata (secondi)');
    const input = new TextInputBuilder()
      .setCustomId('field_gw_duration')
      .setLabel('Durata in secondi')
      .setPlaceholder('Es. 86400')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setValue(String(cfg.giveawayDuration || 86400));
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    return interaction.showModal(modal);
  }

  // Embed customization buttons open modals
  const modalMap = {
    gw_embed_color: { title: 'Colore (hex o numero)', id: 'modal_gw_color', field: 'field_gw_color', value: String(cfg.giveawayEmbedColor || '#5865F2') },
    gw_embed_title: { title: 'Titolo', id: 'modal_gw_title', field: 'field_gw_title', value: String(cfg.giveawayEmbedTitle || '') },
    gw_embed_desc: { title: 'Descrizione', id: 'modal_gw_desc', field: 'field_gw_desc', value: String(cfg.giveawayEmbedDescription || '') },
    gw_embed_image: { title: 'URL Immagine', id: 'modal_gw_image', field: 'field_gw_image', value: String(cfg.giveawayEmbedImage || '') },
    gw_embed_footer: { title: 'Footer', id: 'modal_gw_footer', field: 'field_gw_footer', value: String(cfg.giveawayEmbedFooter || '') },
  };
  if (modalMap[id]) {
    const meta = modalMap[id];
    const modal = new ModalBuilder().setCustomId(meta.id).setTitle(meta.title);
    const input = new TextInputBuilder()
      .setCustomId(meta.field)
      .setLabel(meta.title)
      .setStyle(id === 'gw_embed_desc' ? TextInputStyle.Paragraph : TextInputStyle.Short)
      .setRequired(false)
      .setValue(meta.value);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    return interaction.showModal(modal);
  }

  if (id === 'gw_embed_reset') {
    await updateConfig(interaction.guildId, {
      giveawayEmbedColor: '#5865F2',
      giveawayEmbedTitle: '🎉 Giveaway!',
      giveawayEmbedDescription: 'Partecipa reagendo con 🎉 per entrare!',
      giveawayEmbedImage: '',
      giveawayEmbedFooter: 'Buona fortuna!'
    });
    return rebuildAndRefresh(interaction);
  }

  if (id === 'giveaway_preview_send') {
    // Send preview in the configured channel if possible
    const channel = cfg.giveawayChannelId ? interaction.guild.channels.cache.get(cfg.giveawayChannelId) : null;
    const previewEmbed = buildEmbedFromConfig(cfg, interaction);
    if (channel && channel.send) {
      await channel.send({ embeds: [previewEmbed] }).catch(() => {});
      // Also refresh UI
      return rebuildAndRefresh(interaction);
    }
    // Fallback: show ephemeral note by editing with a small footer change
    previewEmbed.setFooter({ text: (cfg.giveawayEmbedFooter || 'Buona fortuna!') + ' • Preview non inviata: canale non impostato' });
    return interaction.editReply({ embeds: [previewEmbed] });
  }

  return rebuildAndRefresh(interaction);
}

// Modal routing
async function handleModals(interaction) {
  try {
    const id = interaction.customId;

    // Duration
    if (id === 'modal_gw_duration') {
      const v = interaction.fields.getTextInputValue('field_gw_duration');
      const seconds = Math.max(10, Math.min(31_536_000, parseInt(v, 10) || 86400));
      await updateConfig(interaction.guildId, { giveawayDuration: seconds });
      await interaction.deferUpdate().catch(() => {});
      return rebuildAndRefresh(interaction);
    }

    // Embed fields
    const updates = {};
    if (id === 'modal_gw_color') {
      const raw = interaction.fields.getTextInputValue('field_gw_color')?.trim();
      let color = '#5865F2';
      if (raw) {
        if (raw.startsWith('#') && /^#?[0-9a-fA-F]{6}$/.test(raw)) color = raw.startsWith('#') ? raw : `#${raw}`;
        else if (!Number.isNaN(Number(raw))) color = Number(raw);
      }
      updates.giveawayEmbedColor = color;
    }
    if (id === 'modal_gw_title') {
      updates.giveawayEmbedTitle = String(interaction.fields.getTextInputValue('field_gw_title') || '').slice(0, 256);
    }
    if (id === 'modal_gw_desc') {
      updates.giveawayEmbedDescription = String(interaction.fields.getTextInputValue('field_gw_desc') || '').slice(0, 4000);
    }
    if (id === 'modal_gw_image') {
      const url = String(interaction.fields.getTextInputValue('field_gw_image') || '').trim();
      updates.giveawayEmbedImage = url;
    }
    if (id === 'modal_gw_footer') {
      updates.giveawayEmbedFooter = String(interaction.fields.getTextInputValue('field_gw_footer') || '').slice(0, 2048);
    }

    if (Object.keys(updates).length) {
      await updateConfig(interaction.guildId, updates);
      await interaction.deferUpdate().catch(() => {});
      return rebuildAndRefresh(interaction);
    }

    // Default fallthrough
    await interaction.deferUpdate().catch(() => {});
    return rebuildAndRefresh(interaction);
  } catch (error) {
    console.error('[giveaway] Error in handleModals:', error);
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
