// Dashboard Welcome Embed Customization — 2025-10-13
// Features: color select, image URL, footer, title, live preview (Discord classic embed)
// Flow: onComponent/onModal -> update DB -> refresh config -> rebuild dashboard -> editReply
const db = require('../../database/db');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType } = require('discord.js');

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

function buildDashboard(interaction) {
  const cfg = ensureConfig(interaction);
  const embed = new EmbedBuilder()
    .setTitle(cfg.welcomeEmbed.title)
    .setDescription(cfg.welcomeEmbed.description)
    .setColor(cfg.welcomeEmbed.color)
    .setFooter({ text: cfg.welcomeEmbed.footer });
  if (cfg.welcomeEmbed.image) embed.setImage(cfg.welcomeEmbed.image);

  const channelOptions = getTextChannels(interaction);

  const selectRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('welcome_channel_select')
      .setPlaceholder('Seleziona canale di benvenuto')
      .addOptions(channelOptions)
  );

  const buttonsRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('welcome_toggle').setStyle(ButtonStyle.Secondary).setLabel(cfg.welcomeEnabled ? 'Disattiva' : 'Attiva'),
    new ButtonBuilder().setCustomId('welcome_edit_title').setStyle(ButtonStyle.Primary).setLabel('Titolo'),
    new ButtonBuilder().setCustomId('welcome_edit_desc').setStyle(ButtonStyle.Primary).setLabel('Descrizione'),
    new ButtonBuilder().setCustomId('welcome_edit_color').setStyle(ButtonStyle.Secondary).setLabel('Colore'),
    new ButtonBuilder().setCustomId('welcome_edit_image').setStyle(ButtonStyle.Secondary).setLabel('Immagine')
  );

  return { embed, rows: [selectRow, buttonsRow] };
}

async function handleSelect(interaction, value) {
  const guildId = interaction.guildId;
  await db.updateGuildConfig(guildId, { welcomeChannelId: value });
  const { embed, rows } = buildDashboard(interaction);
  return interaction.editReply({ embeds: [embed], components: rows });
}

async function handleComponent(interaction) {
  const id = interaction.customId;
  const guildId = interaction.guildId;

  if (id === 'welcome_toggle') {
    const cfg = ensureConfig(interaction);
    await db.updateGuildConfig(guildId, { welcomeEnabled: !cfg.welcomeEnabled });
  }

  if (id === 'welcome_edit_title') return showModal(interaction, 'welcome_title_modal', 'Titolo', 'Nuovo titolo');
  if (id === 'welcome_edit_desc') return showModal(interaction, 'welcome_desc_modal', 'Descrizione', 'Nuova descrizione');
  if (id === 'welcome_edit_color') return showModal(interaction, 'welcome_color_modal', 'Colore HEX', '#5865F2');
  if (id === 'welcome_edit_image') return showModal(interaction, 'welcome_image_modal', 'URL immagine', 'https://...');

  const { embed, rows } = buildDashboard(interaction);
  return interaction.editReply({ embeds: [embed], components: rows });
}

function showModal(interaction, customId, label, placeholder) {
  const modal = new ModalBuilder().setCustomId(customId).setTitle('Modifica messaggio di benvenuto');
  const input = new TextInputBuilder().setCustomId('input').setLabel(label).setStyle(TextInputStyle.Short).setPlaceholder(placeholder).setRequired(true);
  const row = new ActionRowBuilder().addComponents(input);
  modal.addComponents(row);
  return interaction.showModal(modal);
}

async function handleModals(interaction) {
  try {
    const id = interaction.customId;
    const v = interaction.fields.getTextInputValue('input');
    const guildId = interaction.guildId;

    if (id === 'welcome_title_modal') await db.updateGuildConfig(guildId, { welcomeEmbed: { ...(ensureConfig(interaction).welcomeEmbed), title: v } });
    else if (id === 'welcome_desc_modal') await db.updateGuildConfig(guildId, { welcomeEmbed: { ...(ensureConfig(interaction).welcomeEmbed), description: v } });
    else if (id === 'welcome_color_modal') await db.updateGuildConfig(guildId, { welcomeEmbed: { ...(ensureConfig(interaction).welcomeEmbed), color: v } });
    else if (id === 'welcome_image_modal') await db.updateGuildConfig(guildId, { welcomeEmbed: { ...(ensureConfig(interaction).welcomeEmbed), image: v } });

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
  // NEW entrypoint required by home.js and dynamic routing
  async execute(interaction) {
    // Backward compatibility: map legacy handlers
    const self = module.exports;
    self.showPanel = self.showPanel || self.handleWelcome;

    try {
      const { embed, rows } = buildDashboard(interaction);
      if (interaction.replied || interaction.deferred) {
        return interaction.editReply({ embeds: [embed], components: rows });
      }
      return interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
    } catch (error) {
      console.error('[welcome] Error in execute:', error);
      return interaction.reply({ content: '❌ Errore nel caricamento della dashboard.', ephemeral: true }).catch(() => {});
    }
  },

  // Legacy main (kept for compatibility)
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
      return interaction.reply({ content: "❌ Errore nell'interazione.", ephemeral: true }).catch(() => {});
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
};
