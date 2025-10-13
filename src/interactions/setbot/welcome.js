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

async function updateConfig(guildId, patch) {
  try {
    await db.guilds.update(guildId, patch);
  } catch (e) {
    console.error('[welcome] updateConfig error:', e);
  }
}

function buildDashboard(interaction) {
  const cfg = ensureConfig(interaction);
  const embed = new EmbedBuilder()
    .setTitle(cfg.welcomeEmbed?.title || 'Benvenuto!')
    .setDescription((cfg.welcomeEmbed?.description || 'Ciao {user}, benvenuto su {server}! 🎉').toString())
    .setColor(cfg.welcomeEmbed?.color || '#5865F2');
  if (cfg.welcomeEmbed?.image) embed.setImage(cfg.welcomeEmbed.image);
  if (cfg.welcomeEmbed?.footer) embed.setFooter({ text: cfg.welcomeEmbed.footer });

  const channelOptions = getTextChannels(interaction);

  const select = new StringSelectMenuBuilder()
    .setCustomId('welcome_channel_select')
    .setPlaceholder(cfg.welcomeChannelId ? `Canale: #${cfg.welcomeChannelId}` : 'Seleziona canale di benvenuto')
    .addOptions(channelOptions);

  const row1 = new ActionRowBuilder().addComponents(select);

  const btnTitle = new ButtonBuilder()
    .setCustomId('welcome_edit_title')
    .setLabel('Titolo')
    .setStyle(ButtonStyle.Primary);
  const btnDesc = new ButtonBuilder()
    .setCustomId('welcome_edit_description')
    .setLabel('Descrizione')
    .setStyle(ButtonStyle.Primary);
  const btnColor = new ButtonBuilder()
    .setCustomId('welcome_edit_color')
    .setLabel('Colore')
    .setStyle(ButtonStyle.Secondary);
  const btnImage = new ButtonBuilder()
    .setCustomId('welcome_edit_image')
    .setLabel('Immagine')
    .setStyle(ButtonStyle.Secondary);
  const btnFooter = new ButtonBuilder()
    .setCustomId('welcome_edit_footer')
    .setLabel('Footer')
    .setStyle(ButtonStyle.Secondary);

  const row2 = new ActionRowBuilder().addComponents(btnTitle, btnDesc, btnColor, btnImage, btnFooter);

  return { embed, rows: [row1, row2] };
}

async function handleSelect(interaction, value) {
  try {
    await updateConfig(interaction.guildId, { welcomeChannelId: value });
    return interaction.reply({ content: '✅ Canale aggiornato!', ephemeral: true }).catch(() => {});
  } catch (e) {
    console.error('[welcome] handleSelect error:', e);
    return interaction.reply({ content: '❌ Errore aggiornando il canale.', ephemeral: true }).catch(() => {});
  }
}

async function handleComponent(interaction) {
  try {
    const id = interaction.customId;
    if (id === 'welcome_edit_title') {
      const modal = new ModalBuilder().setCustomId('welcome_modal_title').setTitle('Titolo embed');
      const field = new TextInputBuilder().setCustomId('welcome_title_field').setLabel('Titolo').setStyle(TextInputStyle.Short).setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(field));
      return interaction.showModal(modal);
    }
    if (id === 'welcome_edit_description') {
      const modal = new ModalBuilder().setCustomId('welcome_modal_description').setTitle('Descrizione embed');
      const field = new TextInputBuilder().setCustomId('welcome_description_field').setLabel('Descrizione').setStyle(TextInputStyle.Paragraph).setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(field));
      return interaction.showModal(modal);
    }
    if (id === 'welcome_edit_color') {
      const modal = new ModalBuilder().setCustomId('welcome_modal_color').setTitle('Colore (hex)');
      const field = new TextInputBuilder().setCustomId('welcome_color_field').setLabel('#HEX, es. #5865F2').setStyle(TextInputStyle.Short).setRequired(true);
      modal.addComponents(new ActionRowBuilder().addComponents(field));
      return interaction.showModal(modal);
    }
    if (id === 'welcome_edit_image') {
      const modal = new ModalBuilder().setCustomId('welcome_modal_image').setTitle('URL immagine');
      const field = new TextInputBuilder().setCustomId('welcome_image_field').setLabel('https://...').setStyle(TextInputStyle.Short).setRequired(false);
      modal.addComponents(new ActionRowBuilder().addComponents(field));
      return interaction.showModal(modal);
    }
    if (id === 'welcome_edit_footer') {
      const modal = new ModalBuilder().setCustomId('welcome_modal_footer').setTitle('Footer');
      const field = new TextInputBuilder().setCustomId('welcome_footer_field').setLabel('Footer').setStyle(TextInputStyle.Short).setRequired(false);
      modal.addComponents(new ActionRowBuilder().addComponents(field));
      return interaction.showModal(modal);
    }
    return interaction.reply({ content: '❌ Azione non riconosciuta.', ephemeral: true }).catch(() => {});
  } catch (error) {
    console.error('[welcome] Error in handleComponent:', error);
    return interaction.reply({ content: "❌ Errore nell'interazione.", ephemeral: true }).catch(() => {});
  }
}

async function handleModals(interaction) {
  try {
    const id = interaction.customId;

    if (id === 'welcome_modal_title') {
      const title = interaction.fields.getTextInputValue('welcome_title_field');
      await updateConfig(interaction.guildId, { welcomeEmbed: { title } });
    }

    if (id === 'welcome_modal_description') {
      const description = interaction.fields.getTextInputValue('welcome_description_field');
      await updateConfig(interaction.guildId, { welcomeEmbed: { description } });
    }

    if (id === 'welcome_modal_color') {
      const color = interaction.fields.getTextInputValue('welcome_color_field');
      await updateConfig(interaction.guildId, { welcomeEmbed: { color } });
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
    return interaction
      .editReply({ content: "❌ Errore durante l'aggiornamento del messaggio.", embeds: [], components: [] })
      .catch(() => {});
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
