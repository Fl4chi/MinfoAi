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
    const guildId = interaction.guildId;
    const cfg = db.getGuildConfig(guildId) || {};
    const merged = {
      guildId,
      welcomeEnabled: cfg.welcomeEnabled ?? true,
      welcomeChannelId: cfg.welcomeChannelId ?? null,
      welcomeMessage: cfg.welcomeMessage ?? '{user}',
      welcomeEmbed: {
        enabled: cfg.welcomeEmbed?.enabled ?? true,
        title: cfg.welcomeEmbed?.title ?? 'Benvenuto!',
        description: cfg.welcomeEmbed?.description ?? 'Ciao {user}, benvenuto su {server}! 🎉',
        color: cfg.welcomeEmbed?.color ?? '#5865F2',
        image: cfg.welcomeEmbed?.image ?? '',
        footer: cfg.welcomeEmbed?.footer ?? 'Arrivato oggi',
      },
    };
    return merged;
  } catch (e) {
    console.error('[welcome] ensureConfig error:', e);
    return ensureConfig({ guildId: interaction?.guildId });
  }
}

// Build dashboard UI (helper used by multiple handlers)
function buildDashboard(interaction) {
  const cfg = ensureConfig(interaction);
  const embed = new EmbedBuilder()
    .setTitle(cfg.welcomeEmbed.title)
    .setDescription(cfg.welcomeEmbed.description)
    .setColor(cfg.welcomeEmbed.color)
    .setFooter({ text: cfg.welcomeEmbed.footer });
  if (cfg.welcomeEmbed.image) embed.setImage(cfg.welcomeEmbed.image);

  const channels = getTextChannels(interaction);
  const rows = [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('welcome_channel_select')
        .setPlaceholder('Seleziona canale di benvenuto')
        .addOptions(channels),
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('welcome_toggle_embed').setLabel('Toggle Embed').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('welcome_edit_text').setLabel('Modifica Testo').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('welcome_edit_color').setLabel('Colore').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('welcome_edit_image').setLabel('Immagine').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('welcome_edit_footer').setLabel('Footer').setStyle(ButtonStyle.Secondary),
    ),
  ];

  return { embed, rows };
}

async function handleSelect(interaction, value) {
  // Persist channel selection then refresh dashboard
  const cfg = ensureConfig(interaction);
  db.setGuildConfig(cfg.guildId, { ...cfg, welcomeChannelId: value });
  const { embed, rows } = buildDashboard(interaction);
  return interaction.editReply({ embeds: [embed], components: rows });
}

async function handleComponent(interaction) {
  const id = interaction.customId;
  // For edits we keep ephemeral dashboard response and update with editReply
  if (id === 'welcome_toggle_embed') {
    const cfg = ensureConfig(interaction);
    db.setGuildConfig(cfg.guildId, {
      ...cfg,
      welcomeEmbed: { ...cfg.welcomeEmbed, enabled: !cfg.welcomeEmbed.enabled },
    });
  } else if (id?.startsWith('welcome_edit_')) {
    // Build and show a modal for text inputs
    const field = id.replace('welcome_edit_', '');
    const modal = new ModalBuilder().setCustomId(`welcome_modal_${field}`).setTitle('Modifica Benvenuto');
    const input = new TextInputBuilder()
      .setCustomId('value')
      .setLabel(`Nuovo valore per ${field}`)
      .setRequired(true)
      .setStyle(TextInputStyle.Paragraph);
    modal.addComponents(new ActionRowBuilder().addComponents(input));
    // showModal ACKs the interaction, but since we already deferred, it's fine to follow up via modal submit
    return interaction.showModal(modal);
  }

  const { embed, rows } = buildDashboard(interaction);
  return interaction.editReply({ embeds: [embed], components: rows });
}

async function handleModals(interaction) {
  try {
    const id = interaction.customId; // welcome_modal_<field>
    const field = id?.split('welcome_modal_')[1];
    const value = interaction.fields.getTextInputValue('value');

    const cfg = ensureConfig(interaction);
    const next = { ...cfg };
    if (['title', 'description', 'color', 'image', 'footer'].includes(field)) {
      next.welcomeEmbed = { ...cfg.welcomeEmbed, [field]: value };
    } else if (field === 'text' || field === 'message') {
      next.welcomeMessage = value;
    }
    db.setGuildConfig(cfg.guildId, next);

    const { embed, rows } = buildDashboard(interaction);
    return interaction.editReply({ embeds: [embed], components: rows });
  } catch (error) {
    console.error('[welcome] Error in handleModals:', error);
    return interaction
      .editReply({ content: "❌ Errore durante l'aggiornamento del messaggio.", embeds: [], components: [] })
      .catch(() => {});
  }
}

module.exports = {
  // Entry used by slash or router
  async execute(interaction) {
    try {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: true });
      }
      if (typeof this.showPanel === 'function') return this.showPanel(interaction);
      if (typeof this.handleVerification === 'function') return this.handleVerification(interaction);
      return interaction.editReply({ content: '❌ Dashboard modulo non implementata correttamente!' });
    } catch (error) {
      console.error('[welcome] Error in execute:', error);
      if (!interaction.replied && !interaction.deferred) {
        return interaction.reply({ content: '❌ Errore nell\'esecuzione.', ephemeral: true }).catch(() => {});
      }
      return interaction.editReply({ content: '❌ Errore nell\'esecuzione.' }).catch(() => {});
    }
  },

  // Legacy main (kept for compatibility)
  async handleWelcome(interaction) {
    try {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: true });
      }
      const { embed, rows } = buildDashboard(interaction);
      return interaction.editReply({ embeds: [embed], components: rows });
    } catch (error) {
      console.error('[welcome] Error in handleWelcome:', error);
      if (!interaction.replied && !interaction.deferred) {
        return interaction.reply({ content: '❌ Errore nel caricamento della dashboard.', ephemeral: true }).catch(() => {});
      }
      return interaction.editReply({ content: '❌ Errore nel caricamento della dashboard.' }).catch(() => {});
    }
  },

  // Alias for compatibility with setbot.js
  async showPanel(interaction, config) {
    return this.handleWelcome(interaction);
  },

  // Router for selects/buttons
  async onComponent(interaction) {
    try {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: true });
      }
      const id = interaction.customId;
      if (id === 'welcome_channel_select') {
        const v = interaction.values?.[0];
        if (v === undefined) {
          return interaction.editReply({ content: '❌ Nessun canale selezionato.' }).catch(() => {});
        }
        return handleSelect(interaction, v);
      }
      return handleComponent(interaction);
    } catch (error) {
      console.error('[welcome] Error in onComponent:', error);
      if (!interaction.replied && !interaction.deferred) {
        return interaction.reply({ content: '❌ Errore nell\'interazione.', ephemeral: true }).catch(() => {});
      }
      return interaction.editReply({ content: '❌ Errore nell\'interazione.' }).catch(() => {});
    }
  },

  // Router for modals
  async onModal(interaction) {
    try {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: true });
      }
      return handleModals(interaction);
    } catch (error) {
      console.error('[welcome] Error in onModal:', error);
      if (!interaction.replied && !interaction.deferred) {
        return interaction.reply({ content: '❌ Errore nella gestione del modal.', ephemeral: true }).catch(() => {});
      }
      return interaction.editReply({ content: '❌ Errore nella gestione del modal.' }).catch(() => {});
    }
  },
};
