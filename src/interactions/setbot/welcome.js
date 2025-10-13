// Dashboard Welcome Embed Customization — 2025-10-13
// Features: color select, image URL, footer, title, live preview (Discord classic embed)
// Flow: onComponent/onModal -> update DB -> refresh config -> rebuild dashboard -> editReply

const db = require('../../database/db');
const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
} = require('discord.js');

// Utilities
function getTextChannels(interaction) {
  try {
    if (!interaction?.guild?.channels?.cache) return [];
    return interaction.guild.channels.cache
      .filter((c) => c && c.type === ChannelType.GuildText)
      .map((c) => ({ label: `#${c.name}`, value: c.id }))
      .slice(0, 24);
  } catch (e) {
    console.error('[welcome] Error fetching channels:', e);
    return [];
  }
}

function ensureConfig(interaction) {
  try {
    if (!interaction?.client) {
      console.error('[welcome] Missing client in interaction');
      return {
        guildId: interaction?.guildId || null,
        welcomeEnabled: false,
        welcomeChannelId: null,
        welcomeMessage: '{user}',
        welcomeEmbed: {
          enabled: true,
          title: 'Benvenuto!',
          description: 'Ciao {user}, benvenuto su {server}! 🎉',
          color: '#5865F2',
          image: '',
          footer: 'Arrivato oggi',
        },
      };
    }

    if (!interaction.client.guildConfigs) {
      interaction.client.guildConfigs = new Map();
    }
    if (!(interaction.client.guildConfigs instanceof Map)) {
      interaction.client.guildConfigs = new Map();
    }

    let cfg = interaction.client.guildConfigs.get(interaction.guildId);
    if (!cfg) {
      cfg = {
        guildId: interaction.guildId,
        welcomeEnabled: false,
        welcomeChannelId: null,
        welcomeMessage: '{user}',
        welcomeEmbed: {
          enabled: true,
          title: 'Benvenuto!',
          description: 'Ciao {user}, benvenuto su {server}! 🎉',
          color: '#5865F2',
          image: '',
          footer: 'Arrivato oggi',
        },
      };
      interaction.client.guildConfigs.set(interaction.guildId, cfg);
    } else if (!cfg.welcomeEmbed) {
      cfg.welcomeEmbed = {
        enabled: true,
        title: 'Benvenuto!',
        description: 'Ciao {user}, benvenuto su {server}! 🎉',
        color: '#5865F2',
        image: '',
        footer: 'Arrivato oggi',
      };
      interaction.client.guildConfigs.set(interaction.guildId, cfg);
    }
    return cfg;
  } catch (e) {
    console.error('[welcome] ensureConfig error:', e);
    return {
      guildId: interaction?.guildId || null,
      welcomeEnabled: false,
      welcomeChannelId: null,
      welcomeMessage: '{user}',
      welcomeEmbed: {
        enabled: true,
        title: 'Benvenuto!',
        description: 'Ciao {user}, benvenuto su {server}! 🎉',
        color: '#5865F2',
        image: '',
        footer: 'Arrivato oggi',
      },
    };
  }
}

// Persist partial updates
async function updateConfig(guildId, patch) {
  try {
    const current = (await db.config.getGuildConfig(guildId)) || {};
    const next = { ...current, ...patch, welcomeEmbed: { ...(current.welcomeEmbed || {}), ...(patch.welcomeEmbed || {}) } };
    await db.config.setGuildConfig(guildId, next);
    return next;
  } catch (e) {
    console.error('[welcome] updateConfig error:', e);
    throw e;
  }
}

// Build preview embed using placeholders
function buildPreviewEmbed(cfg, interaction) {
  const member = interaction?.member;
  const serverName = interaction?.guild?.name || 'Server';
  const userMention = member?.toString?.() || '{user}';

  const e = cfg.welcomeEmbed || {};
  const desc = (e.description || 'Ciao {user}, benvenuto su {server}!')
    .replaceAll('{user}', userMention)
    .replaceAll('{server}', serverName);
  const title = (e.title || 'Benvenuto!')
    .replaceAll('{user}', userMention)
    .replaceAll('{server}', serverName);

  const embed = new EmbedBuilder()
    .setDescription(desc)
    .setColor(parseColor(e.color || '#5865F2'));

  if (title) embed.setTitle(title);
  if (e.image) embed.setImage(e.image);
  if (e.footer) embed.setFooter({ text: e.footer });

  return embed;
}

function parseColor(hex) {
  try {
    if (!hex) return 0x5865F2; // Discord blurple
    const norm = hex.trim().toLowerCase();
    const v = norm.startsWith('#') ? norm.slice(1) : norm;
    const num = parseInt(v, 16);
    if (Number.isNaN(num)) return 0x5865F2;
    return num;
  } catch {
    return 0x5865F2;
  }
}

// Dashboard UI
function buildDashboard(interaction) {
  const cfg = ensureConfig(interaction);

  // Channel select
  const channelOptions = getTextChannels(interaction);
  const channelSelect = new StringSelectMenuBuilder()
    .setCustomId('welcome_channel_select')
    .setPlaceholder(cfg.welcomeChannelId ? `Canale: #${interaction.guild.channels.cache.get(cfg.welcomeChannelId)?.name || 'seleziona'}` : 'Seleziona canale')
    .addOptions(channelOptions);

  // Enable toggle and message editor
  const enableBtn = new ButtonBuilder()
    .setCustomId('welcome_toggle')
    .setLabel(cfg.welcomeEnabled ? 'Disattiva' : 'Attiva')
    .setStyle(cfg.welcomeEnabled ? ButtonStyle.Danger : ButtonStyle.Success);

  const editMsgBtn = new ButtonBuilder()
    .setCustomId('welcome_edit_message')
    .setLabel('Modifica Testo Messaggio')
    .setStyle(ButtonStyle.Secondary);

  // Embed customization controls
  const colorBtn = new ButtonBuilder()
    .setCustomId('welcome_color_open')
    .setLabel('Colore')
    .setStyle(ButtonStyle.Primary);

  const titleBtn = new ButtonBuilder()
    .setCustomId('welcome_title_open')
    .setLabel('Titolo')
    .setStyle(ButtonStyle.Secondary);

  const imageBtn = new ButtonBuilder()
    .setCustomId('welcome_image_open')
    .setLabel('Immagine (URL)')
    .setStyle(ButtonStyle.Secondary);

  const footerBtn = new ButtonBuilder()
    .setCustomId('welcome_footer_open')
    .setLabel('Footer')
    .setStyle(ButtonStyle.Secondary);

  const presetSelect = new StringSelectMenuBuilder()
    .setCustomId('welcome_color_preset')
    .setPlaceholder('Colori rapidi')
    .addOptions([
      { label: 'Discord Blurple', value: '#5865F2' },
      { label: 'Verde', value: '#57F287' },
      { label: 'Rosso', value: '#ED4245' },
      { label: 'Giallo', value: '#FEE75C' },
      { label: 'Oro', value: '#FAA61A' },
      { label: 'Viola', value: '#9B59B6' },
      { label: 'Ciano', value: '#1ABC9C' },
      { label: 'Nero', value: '#2C2F33' },
    ]);

  // Rows
  const row1 = new ActionRowBuilder().addComponents(channelSelect);
  const row2 = new ActionRowBuilder().addComponents(enableBtn, editMsgBtn);
  const row3 = new ActionRowBuilder().addComponents(colorBtn, titleBtn, imageBtn, footerBtn);
  const row4 = new ActionRowBuilder().addComponents(presetSelect);

  const preview = buildPreviewEmbed(cfg, interaction);
  preview.setAuthor({ name: 'Anteprima Welcome Embed' });

  return { embed: preview, rows: [row1, row2, row3, row4] };
}

// Handle component interactions
async function handleSelect(interaction, value) {
  const id = interaction.customId;
  const cfg = ensureConfig(interaction);
  await interaction.deferUpdate().catch(() => {});

  try {
    if (id === 'welcome_channel_select') {
      const channelId = value;
      await updateConfig(interaction.guildId, { welcomeChannelId: channelId });
    } else if (id === 'welcome_color_preset') {
      await updateConfig(interaction.guildId, { welcomeEmbed: { color: value } });
    }
  } catch (e) {
    console.error('[welcome] handleSelect error:', e);
  }

  const { embed, rows } = buildDashboard(interaction);
  return interaction.editReply({ embeds: [embed], components: rows });
}

async function handleComponent(interaction) {
  const id = interaction.customId;
  await interaction.deferUpdate().catch(() => {});

  try {
    if (id === 'welcome_toggle') {
      const current = (await db.config.getGuildConfig(interaction.guildId)) || ensureConfig(interaction);
      await updateConfig(interaction.guildId, { welcomeEnabled: !current.welcomeEnabled });
    }
    if (id === 'welcome_edit_message') {
      const modal = new ModalBuilder()
        .setCustomId('welcome_modal_message')
        .setTitle('Testo Messaggio Welcome');
      const txt = new TextInputBuilder()
        .setCustomId('welcome_message_field')
        .setLabel('Messaggio (supporta {user}, {server})')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true)
        .setMaxLength(1900);
      modal.addComponents(new ActionRowBuilder().addComponents(txt));
      return interaction.showModal(modal);
    }
    if (id === 'welcome_color_open') {
      const modal = new ModalBuilder().setCustomId('welcome_modal_color').setTitle('Colore Embed');
      const inp = new TextInputBuilder()
        .setCustomId('welcome_color_field')
        .setLabel('Hex (#RRGGBB)')
        .setPlaceholder('#5865F2')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(inp));
      return interaction.showModal(modal);
    }
    if (id === 'welcome_title_open') {
      const modal = new ModalBuilder().setCustomId('welcome_modal_title').setTitle('Titolo Embed');
      const inp = new TextInputBuilder()
        .setCustomId('welcome_title_field')
        .setLabel('Titolo (supporta {user}, {server})')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setMaxLength(256);
      modal.addComponents(new ActionRowBuilder().addComponents(inp));
      return interaction.showModal(modal);
    }
    if (id === 'welcome_image_open') {
      const modal = new ModalBuilder().setCustomId('welcome_modal_image').setTitle('Immagine Embed');
      const inp = new TextInputBuilder()
        .setCustomId('welcome_image_field')
        .setLabel('URL immagine (https://...)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setMaxLength(500);
      modal.addComponents(new ActionRowBuilder().addComponents(inp));
      return interaction.showModal(modal);
    }
    if (id === 'welcome_footer_open') {
      const modal = new ModalBuilder().setCustomId('welcome_modal_footer').setTitle('Footer Embed');
      const inp = new TextInputBuilder()
        .setCustomId('welcome_footer_field')
        .setLabel('Footer')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)
        .setMaxLength(2048);
      modal.addComponents(new ActionRowBuilder().addComponents(inp));
      return interaction.showModal(modal);
    }
  } catch (e) {
    console.error('[welcome] handleComponent error:', e);
  }

  const { embed, rows } = buildDashboard(interaction);
  return interaction.editReply({ embeds: [embed], components: rows });
}

async function handleModals(interaction) {
  try {
    const id = interaction.customId;
    await interaction.deferUpdate().catch(() => {});

    if (id === 'welcome_modal_message') {
      const msg = interaction.fields.getTextInputValue('welcome_message_field').slice(0, 1900);
      await updateConfig(interaction.guildId, { welcomeMessage: msg });
    }
    if (id === 'welcome_modal_color') {
      const color = interaction.fields.getTextInputValue('welcome_color_field');
      await updateConfig(interaction.guildId, { welcomeEmbed: { color } });
    }
    if (id === 'welcome_modal_title') {
      const title = interaction.fields.getTextInputValue('welcome_title_field');
      await updateConfig(interaction.guildId, { welcomeEmbed: { title } });
    }
    if (id === 'welcome_modal_image') {
      const image = interaction.fields.getTextInputValue('welcome_image_field');
      await updateConfig(interaction.guildId, { welcomeEmbed: { image } });
    }
    if (id === 'welcome_modal_footer') {
      const footer = interaction.fields.getTextInputValue('welcome_footer_field');
      await updateConfig(interaction.guildId, { welcomeEmbed: { footer } });
    }

    const { embed, rows } = buildDashboard(interaction);
    return interaction.editReply({ embeds: [embed], components: rows });
  } catch (error) {
    console.error('[welcome] Error in handleModals:', error);
    return interaction.editReply({ content: '❌ Errore durante l\'aggiornamento del messaggio.', embeds: [], components: [] }).catch(() => {});
  }
}

module.exports = {
  // Entrypoint to render dashboard
  async handleWelcome(interaction) {
    try {
      const { embed, rows } = buildDashboard(interaction);
      if (interaction.replied || interaction.deferred) {
        return interaction.editReply({ embeds: [embed], components: rows });
      }
      return interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
    } catch (error) {
      console.error('[welcome] Error in handleWelcome:', error);
      return interaction.reply({ content: '❌ Errore nel caricamento della dashboard.', ephemeral: true }).catch(() => {});
    }
  },

  // Alias for compatibility with setbot.js
  async showPanel(interaction, config) {
    return this.handleWelcome(interaction);
  },

  // Router for selects/buttons
  async onComponent(interaction) {
    try {
      const id = interaction.customId;
      if (id === 'welcome_channel_select') {
        const v = interaction.values?.[0];
        if (v === undefined) {
          return interaction.reply({ content: '❌ Nessun canale selezionato.', ephemeral: true }).catch(() => {});
        }
        return handleSelect(interaction, v);
      }
      return handleComponent(interaction);
    } catch (error) {
      console.error('[welcome] Error in onComponent:', error);
      return interaction.reply({ content: '❌ Errore nell\'interazione.', ephemeral: true }).catch(() => {});
    }
  },

  // Router for modals
  async onModal(interaction) {
    try {
      return handleModals(interaction);
    } catch (error) {
      console.error('[welcome] Error in onModal:', error);
      return interaction.reply({ content: '❌ Errore nella gestione del modal.', ephemeral: true }).catch(() => {});
    }
  },
