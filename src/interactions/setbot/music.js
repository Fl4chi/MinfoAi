// Updated: 2025-10-14 - Dashboard Musica con select canale + 4 azioni
// Requisiti: solo select menu per canale musica (voice), bottoni: On/Off, Ripristina, Messaggio (modal), Anteprima
// Ogni azione aggiorna live la preview e le variabili. Interfaccia minimale, codice difensivo, nessun elemento in home.
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
// Helpers
function getVoiceChannels(interaction) {
  try {
    const channels = interaction.guild.channels.cache
      .filter((c) => c.type === ChannelType.GuildVoice)
      .map((c) => ({ label: `🔊 ${c.name}`, value: c.id }))
      .slice(0, 24);
    return channels.length > 0
      ? channels
      : [{ label: 'Nessun canale vocale disponibile', value: 'unavailable' }];
  } catch (err) {
    console.error('[music.js] Errore recupero canali vocali:', err);
    return [{ label: 'Errore caricamento canali', value: 'error' }];
  }
}
function ensureConfig(interaction) {
  // Ensure in-memory map exists
  if (!interaction.client.guildConfigs) interaction.client.guildConfigs = new Map();
  let cfg = interaction.client.guildConfigs.get(interaction.guildId);
  if (!cfg) {
    cfg = {
      guildId: interaction.guildId,
      musicEnabled: false,
      musicVoiceChannelId: null,
      musicMsg: {
        title: null,
        description: null,
        image: null,
      },
    };
    interaction.client.guildConfigs.set(interaction.guildId, cfg);
  }
  if (typeof cfg.musicEnabled !== 'boolean') cfg.musicEnabled = false;
  if (cfg.musicVoiceChannelId === undefined) cfg.musicVoiceChannelId = null;
  if (!cfg.musicMsg) cfg.musicMsg = { title: null, description: null, image: null };
  return cfg;
}
function buildEmbed(interaction) {
  const cfg = ensureConfig(interaction);
  const statusEmoji = cfg.musicEnabled ? '🟢' : '🔴';
  const statusText = cfg.musicEnabled ? 'ON' : 'OFF';
  const statusColor = cfg.musicEnabled ? 0x43b581 : 0xed4245;
  const channelDisplay = cfg.musicVoiceChannelId ? `<#${cfg.musicVoiceChannelId}>` : '`Non configurato`';
  const embed = new EmbedBuilder()
    .setTitle(cfg.musicMsg.title || '🎵 Dashboard Musica')
    .setDescription(
      (cfg.musicMsg.description || '') +
        (cfg.musicMsg.description ? '\n\n' : '') +
        `**Stato**: ${statusEmoji} **${statusText}**\n**Canale Musica**: ${channelDisplay}`
    )
    .setColor(statusColor)
    .addFields({
      name: '📋 Azioni',
      value:
        '• Scegli il canale vocale dal menu\n' +
        '• Usa i pulsanti per abilitare/disabilitare, ripristinare, impostare messaggio o anteprima',
      inline: false,
    })
    .setFooter({ text: 'Configurazione Musica' })
    .setTimestamp();
  if (cfg.musicMsg.image) {
    try {
      embed.setImage(cfg.musicMsg.image);
    } catch (e) {
      // ignora URL immagine non valida
    }
  }
  return embed;
}
function buildComponents(interaction) {
  const cfg = ensureConfig(interaction);
  const channels = getVoiceChannels(interaction);
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('music_channel_select')
    .setPlaceholder(cfg.musicVoiceChannelId ? '🔊 Canale impostato' : '🎵 Seleziona canale musica')
    .addOptions([{ label: '🚫 Nessun canale (disabilita)', value: 'none', description: 'Disabilita la musica' }, ...channels]);
  const btnOnOff = new ButtonBuilder()
    .setCustomId('music_toggle')
    .setLabel(cfg.musicEnabled ? 'Spegni' : 'Accendi')
    .setStyle(cfg.musicEnabled ? ButtonStyle.Danger : ButtonStyle.Success);
  const btnReset = new ButtonBuilder().setCustomId('music_reset').setLabel('Ripristina').setStyle(ButtonStyle.Secondary);
  const btnMsg = new ButtonBuilder().setCustomId('music_message').setLabel('Messaggio').setStyle(ButtonStyle.Primary);
  const btnPreview = new ButtonBuilder().setCustomId('music_preview').setLabel('Anteprima').setStyle(ButtonStyle.Secondary);
  const row1 = new ActionRowBuilder().addComponents(selectMenu);
  const row2 = new ActionRowBuilder().addComponents(btnOnOff, btnReset, btnMsg, btnPreview);
  return [row1, row2];
}
function buildDashboard(interaction) {
  return { embed: buildEmbed(interaction), rows: buildComponents(interaction) };
}
async function persist(interaction) {
  const cfg = ensureConfig(interaction);
  try {
    await db.updateGuildConfig(interaction.guildId, {
      musicEnabled: cfg.musicEnabled,
      musicVoiceChannelId: cfg.musicVoiceChannelId,
      musicMsg: cfg.musicMsg,
    });
    const fresh = await db.getGuildConfig(interaction.guildId);
    if (fresh) {
      if (!interaction.client.guildConfigs) interaction.client.guildConfigs = new Map();
      interaction.client.guildConfigs.set(interaction.guildId, fresh);
    }
  } catch (e) {
    console.error('[music.js] Persist error:', e);
  }
}
async function handleSelect(interaction, channelId) {
  try {
    await interaction.deferUpdate();
    const cfg = ensureConfig(interaction);
    if (channelId === 'none') {
      cfg.musicVoiceChannelId = null;
      cfg.musicEnabled = false;
    } else if (channelId === 'unavailable' || channelId === 'error') {
      return interaction.editReply({ content: '❌ Nessun canale vocale disponibile.', embeds: [], components: [] });
    } else {
      const channel = interaction.guild.channels.cache.get(channelId);
      if (!channel || channel.type !== ChannelType.GuildVoice) {
        return interaction.editReply({ content: '❌ Canale vocale non valido.', embeds: [], components: [] });
      }
      cfg.musicVoiceChannelId = channelId;
      cfg.musicEnabled = true;
    }
    await persist(interaction);
    const { embed, rows } = buildDashboard(interaction);
    return interaction.editReply({ embeds: [embed], components: rows });
  } catch (err) {
    console.error('[music.js] Errore handleSelect:', err);
    return interaction
      .editReply({ content: "❌ Errore durante l'aggiornamento della configurazione musica.", embeds: [], components: [] })
      .catch(() => {});
  }
}
async function handleToggle(interaction) {
  try {
    await interaction.deferUpdate();
    const cfg = ensureConfig(interaction);
    // Toggle only state, do not change channel here
    if (!cfg.musicVoiceChannelId && !cfg.musicEnabled) {
      // Cannot enable without channel
      return interaction.editReply({ content: '❌ Seleziona prima un canale vocale.', embeds: [], components: [] });
    }
    cfg.musicEnabled = !cfg.musicEnabled;
    if (!cfg.musicEnabled) {
      // When turning off, also clear channel as per requirement
      cfg.musicVoiceChannelId = null;
    }
    await persist(interaction);
    const { embed, rows } = buildDashboard(interaction);
    return interaction.editReply({ embeds: [embed], components: rows });
  } catch (e) {
    console.error('[music.js] Errore toggle:', e);
    return interaction.editReply({ content: '❌ Errore toggle.', embeds: [], components: [] }).catch(() => {});
  }
}
async function handleReset(interaction) {
  try {
    await interaction.deferUpdate();
    const cfg = ensureConfig(interaction);
    cfg.musicEnabled = false;
    cfg.musicVoiceChannelId = null;
    cfg.musicMsg = { title: null, description: null, image: null };
    await persist(interaction);
    const { embed, rows } = buildDashboard(interaction);
    return interaction.editReply({ embeds: [embed], components: rows });
  } catch (e) {
    console.error('[music.js] Errore reset:', e);
    return interaction.editReply({ content: '❌ Errore ripristino.', embeds: [], components: [] }).catch(() => {});
  }
}
async function handleMessageModalOpen(interaction) {
  try {
    const cfg = ensureConfig(interaction);
    const modal = new ModalBuilder().setCustomId('music_message_modal').setTitle('Messaggio musica');
    const titleInput = new TextInputBuilder()
      .setCustomId('music_msg_title')
      .setLabel('Titolo (opzionale)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setValue(cfg.musicMsg.title || '');
    const descInput = new TextInputBuilder()
      .setCustomId('music_msg_desc')
      .setLabel('Descrizione (opzionale)')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(false)
      .setValue(cfg.musicMsg.description || '');
    const imgInput = new TextInputBuilder()
      .setCustomId('music_msg_img')
      .setLabel('URL immagine (opzionale)')
      .setStyle(TextInputStyle.Short)
      .setRequired(false)
      .setValue(cfg.musicMsg.image || '');
    modal.addComponents(
      new ActionRowBuilder().addComponents(titleInput),
      new ActionRowBuilder().addComponents(descInput),
      new ActionRowBuilder().addComponents(imgInput)
    );
    return interaction.showModal(modal);
  } catch (e) {
    console.error('[music.js] Errore apertura modal:', e);
    return interaction.reply({ content: '❌ Errore apertura modale.', ephemeral: true }).catch(() => {});
  }
}
async function handleMessageModalSubmit(interaction) {
  try {
    const cfg = ensureConfig(interaction);
    const title = interaction.fields.getTextInputValue('music_msg_title')?.trim() || null;
    const description = interaction.fields.getTextInputValue('music_msg_desc')?.trim() || null;
    const image = interaction.fields.getTextInputValue('music_msg_img')?.trim() || null;
    // Validazione immagine basica
    const imgOk = !image || /^https?:\/\//i.test(image);
    cfg.musicMsg = {
      title,
      description,
      image: imgOk ? image : null,
    };
    await persist(interaction);
    const { embed, rows } = buildDashboard(interaction);
    if (interaction.replied || interaction.deferred) {
      return interaction.editReply({ embeds: [embed], components: rows });
    }
    return interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
  } catch (e) {
    console.error('[music.js] Errore submit modal:', e);
    return interaction.reply({ content: '❌ Errore salvataggio messaggio.', ephemeral: true }).catch(() => {});
  }
}
async function handlePreview(interaction) {
  try {
    await interaction.deferUpdate();
    const embed = buildEmbed(interaction);
    const rows = buildComponents(interaction);
    return interaction.editReply({ embeds: [embed], components: rows });
  } catch (e) {
    console.error('[music.js] Errore anteprima:', e);
    return interaction.editReply({ content: '❌ Errore anteprima.', embeds: [], components: [] }).catch(() => {});
  }
}
module.exports = {
  // compatibilità
  async execute(interaction) {
    if (typeof this.showPanel === 'function') return this.showPanel(interaction);
    return interaction.reply({ content: '❌ Dashboard musica non implementata correttamente!', ephemeral: true });
  },
  async handleMusic(interaction) {
    try {
      const { embed, rows } = buildDashboard(interaction);
      if (interaction.replied || interaction.deferred) {
        return interaction.editReply({ embeds: [embed], components: rows });
      }
      return interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
    } catch (err) {
      console.error('[music.js] Errore handleMusic:', err);
      const errorMsg = '❌ Errore durante il caricamento della dashboard musica.';
      if (interaction.replied || interaction.deferred) {
        return interaction.editReply({ content: errorMsg, embeds: [], components: [] });
      }
      return interaction.reply({ content: errorMsg, ephemeral: true });
    }
  },
  async onComponent(interaction) {
    const id = interaction.customId;
    try {
      if (id === 'music_channel_select') {
        const channelId = interaction.values?.[0];
        if (!channelId) return interaction.reply({ content: '❌ Nessun canale selezionato.', ephemeral: true });
        return handleSelect(interaction, channelId);
      }
      if (id === 'music_toggle') return handleToggle(interaction);
      if (id === 'music_reset') return handleReset(interaction);
      if (id === 'music_message') return handleMessageModalOpen(interaction);
      if (id === 'music_preview') return handlePreview(interaction);
      return interaction.reply({ content: '❌ Componente non riconosciuto.', ephemeral: true });
    } catch (e) {
      console.error('[music.js] onComponent error:', e);
      return interaction.reply({ content: '❌ Errore componente.', ephemeral: true }).catch(() => {});
    }
  },
  async onModalSubmit(interaction) {
    if (interaction.customId === 'music_message_modal') {
      return handleMessageModalSubmit(interaction);
    }
    return interaction.reply({ content: '❌ Modale non riconosciuta.', ephemeral: true }).catch(() => {});
  },
  async showPanel(interaction) {
    return this.handleMusic(interaction);
  },
};
