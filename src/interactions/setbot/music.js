// Refactored: 2025-10-14 - Dashboard musica ottimizzata (pattern: select-only, embed live, gestione errori)
// Architettura: solo select menu per canale musica, embed con stato/canale/preview, no bottoni, codice pulito/difensivo
// Pattern: onComponent, buildDashboard (ref: goodbye.js)

const db = require('../../database/db');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelType } = require('discord.js');

// Helper: get voice channels per select menu
function getVoiceChannels(interaction) {
  try {
    const channels = interaction.guild.channels.cache
      .filter(c => c.type === ChannelType.GuildVoice)
      .map(c => ({ label: `🔊 ${c.name}`, value: c.id }))
      .slice(0, 24);
    return channels.length > 0 ? channels : [{ label: 'Nessun canale vocale disponibile', value: 'unavailable' }];
  } catch (err) {
    console.error('[music.js] Errore recupero canali vocali:', err);
    return [{ label: 'Errore caricamento canali', value: 'error' }];
  }
}

// Helper: ensure config con valori di default
function ensureConfig(interaction) {
  let cfg = interaction.client.guildConfigs.get(interaction.guildId);
  if (!cfg) {
    cfg = {
      guildId: interaction.guildId,
      musicEnabled: false,
      musicVoiceChannelId: null
    };
    interaction.client.guildConfigs.set(interaction.guildId, cfg);
  }
  // Normalize boolean
  if (typeof cfg.musicEnabled !== 'boolean') cfg.musicEnabled = false;
  if (cfg.musicVoiceChannelId === undefined) cfg.musicVoiceChannelId = null;
  return cfg;
}

// Build dashboard embed + components
function buildDashboard(interaction) {
  const cfg = ensureConfig(interaction);
  const channels = getVoiceChannels(interaction);

  // Stato live: ON/OFF con colore e descrizione
  const statusEmoji = cfg.musicEnabled ? '🟢' : '🔴';
  const statusText = cfg.musicEnabled ? 'ON' : 'OFF';
  const statusColor = cfg.musicEnabled ? '#43B581' : '#ED4245';

  // Canale: nome o placeholder
  const channelDisplay = cfg.musicVoiceChannelId
    ? `<#${cfg.musicVoiceChannelId}>`
    : '`Non configurato`';

  // Descrizione con preview attuale
  const description = `**Stato**: ${statusEmoji} **${statusText}**\n**Canale Musica**: ${channelDisplay}`;

  const embed = new EmbedBuilder()
    .setTitle('🎵 Dashboard Musica')
    .setDescription(description)
    .setColor(statusColor)
    .addFields(
      {
        name: '📋 Azioni Disponibili',
        value: '• Seleziona il canale vocale dedicato alla musica dal menu sottostante\n• Il sistema si abiliterà automaticamente quando configurato',
        inline: false
      }
    )
    .setFooter({ text: 'Configurazione Musica' })
    .setTimestamp();

  // Select menu per canale musica
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('music_channel_select')
    .setPlaceholder(cfg.musicVoiceChannelId ? '🔊 Canale impostato' : '🎵 Seleziona canale musica')
    .addOptions([
      { label: '🚫 Nessun canale (disabilita)', value: 'none', description: 'Disabilita il sistema musica' },
      ...channels
    ]);

  const row = new ActionRowBuilder().addComponents(selectMenu);
  return { embed, rows: [row] };
}

// Handle select menu
async function handleSelect(interaction, channelId) {
  try {
    await interaction.deferUpdate();
    const cfg = ensureConfig(interaction);

    // Gestione selezione
    if (channelId === 'none') {
      cfg.musicVoiceChannelId = null;
      cfg.musicEnabled = false;
    } else if (channelId === 'unavailable' || channelId === 'error') {
      return interaction.editReply({
        content: '❌ Impossibile configurare: nessun canale vocale disponibile.',
        embeds: [],
        components: []
      });
    } else {
      // Verifica che il canale esista ancora
      const channel = interaction.guild.channels.cache.get(channelId);
      if (!channel || channel.type !== ChannelType.GuildVoice) {
        return interaction.editReply({
          content: '❌ Canale vocale non valido o non più disponibile.',
          embeds: [],
          components: []
        });
      }
      cfg.musicVoiceChannelId = channelId;
      cfg.musicEnabled = true;
    }

    // Update DB
    await db.updateGuildConfig(interaction.guildId, {
      musicVoiceChannelId: cfg.musicVoiceChannelId,
      musicEnabled: cfg.musicEnabled
    });

    // Rebuild config from DB
    const freshCfg = await db.getGuildConfig(interaction.guildId);
    if (freshCfg) {
      interaction.client.guildConfigs.set(interaction.guildId, freshCfg);
    }

    // Rebuild dashboard
    const { embed, rows } = buildDashboard(interaction);
    return interaction.editReply({ embeds: [embed], components: rows });
  } catch (err) {
    console.error('[music.js] Errore handleSelect:', err);
    return interaction.editReply({
      content: '❌ Errore durante l\'aggiornamento della configurazione musica.',
      embeds: [],
      components: []
    }).catch(() => {});
  }
}

module.exports = {
  // Fallback execute per compatibilità
  async execute(interaction) {
    if (typeof this.showPanel === 'function') return this.showPanel(interaction);
    return interaction.reply({ content: '❌ Dashboard musica non implementata correttamente!', ephemeral: true });
  },

  // Entrypoint: render dashboard
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

  // Router per select menu
  async onComponent(interaction) {
    const id = interaction.customId;
    if (id === 'music_channel_select') {
      const channelId = interaction.values?.[0];
      if (!channelId) {
        return interaction.reply({ content: '❌ Nessun canale selezionato.', ephemeral: true });
      }
      return handleSelect(interaction, channelId);
    }
    // Nessun altro componente gestito
    return interaction.reply({ content: '❌ Componente non riconosciuto.', ephemeral: true });
  },

  // Alias per compatibilità con setbot.js
  async showPanel(interaction) {
    return this.handleMusic(interaction);
  }
};
