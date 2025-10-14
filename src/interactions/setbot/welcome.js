// Dashboard Welcome Embed Customization — 2025-10-14
// OTTIMIZZATO: Solo select canale, aggiornamento live istantaneo, niente bottoni
// Flow: selezione -> aggiorna DB -> ricostruisci dashboard -> editReply istantaneo

const db = require('../../database/db');
const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ChannelType,
} = require('discord.js');

// ========== UTILITIES ==========

function getTextChannels(interaction) {
  try {
    if (!interaction?.guild?.channels?.cache) return [];
    
    const channels = interaction.guild.channels.cache
      .filter((c) => c?.type === ChannelType.GuildText)
      .map((c) => ({ label: `#${c.name}`, value: c.id }))
      .slice(0, 25);
    
    // Se non ci sono canali, aggiungi placeholder
    if (channels.length === 0) {
      return [{ label: 'Nessun canale disponibile', value: 'none', default: true }];
    }
    
    return channels;
  } catch (e) {
    console.error('[welcome] Error fetching channels:', e);
    return [{ label: 'Errore caricamento canali', value: 'error', default: true }];
  }
}

function ensureConfig(interaction) {
  try {
    const guildId = interaction?.guildId;
    if (!guildId) {
      console.error('[welcome] Missing guildId in interaction');
      return getDefaultConfig(null);
    }
    
    const cfg = db.getGuildConfig(guildId) || {};
    
    return {
      guildId,
      welcomeEnabled: cfg.welcomeEnabled ?? true,
      welcomeChannelId: cfg.welcomeChannelId || null,
      welcomeMessage: cfg.welcomeMessage || '{user}',
      welcomeEmbed: {
        enabled: cfg.welcomeEmbed?.enabled ?? true,
        title: cfg.welcomeEmbed?.title || 'Benvenuto!',
        description: cfg.welcomeEmbed?.description || 'Ciao {user}, benvenuto su {server}! 🎉',
        color: cfg.welcomeEmbed?.color || '#5865F2',
        image: cfg.welcomeEmbed?.image || '',
        footer: cfg.welcomeEmbed?.footer || 'Arrivato oggi',
      },
    };
  } catch (e) {
    console.error('[welcome] ensureConfig error:', e);
    return getDefaultConfig(interaction?.guildId || null);
  }
}

function getDefaultConfig(guildId) {
  return {
    guildId,
    welcomeEnabled: true,
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

// ========== FUNZIONE CENTRALIZZATA DASHBOARD ==========
// Questa funzione ricostruisce SEMPRE la dashboard con i dati FRESCHI dal DB

function buildDashboard(interaction) {
  try {
    // 1. Ottieni configurazione fresca dal DB
    const cfg = ensureConfig(interaction);
    
    // 2. Costruisci embed con valori AGGIORNATI
    const embed = new EmbedBuilder()
      .setTitle(cfg.welcomeEmbed.title || 'Benvenuto!')
      .setDescription(cfg.welcomeEmbed.description || 'Ciao {user}, benvenuto su {server}!')
      .setColor(cfg.welcomeEmbed.color || '#5865F2')
      .setFooter({ text: cfg.welcomeEmbed.footer || 'Arrivato oggi' });
    
    if (cfg.welcomeEmbed.image) {
      embed.setImage(cfg.welcomeEmbed.image);
    }
    
    // 3. Aggiungi campo informativo con TUTTE le variabili correnti
    const statusLines = [
      `🔔 **Stato**: ${cfg.welcomeEnabled ? '✅ Attivo' : '❌ Disattivo'}`,
      `📢 **Canale**: ${cfg.welcomeChannelId ? `<#${cfg.welcomeChannelId}>` : '❌ Non impostato'}`,
      `📝 **Messaggio**: ${cfg.welcomeMessage || '{user}'}`,
      `🎨 **Colore Embed**: ${cfg.welcomeEmbed.color || '#5865F2'}`,
      `🖼️ **Immagine**: ${cfg.welcomeEmbed.image ? '✅ Impostata' : '❌ Nessuna'}`,
      `📌 **Footer**: ${cfg.welcomeEmbed.footer || 'Arrivato oggi'}`,
    ];
    
    embed.addFields({ 
      name: '⚙️ Configurazione Corrente', 
      value: statusLines.join('\n'), 
      inline: false 
    });
    
    // 4. Ottieni lista canali
    const channels = getTextChannels(interaction);
    
    // 5. Costruisci select menu (UNICO componente)
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('welcome_channel_select')
      .setPlaceholder(
        cfg.welcomeChannelId 
          ? `Canale: #${interaction.guild?.channels?.cache?.get(cfg.welcomeChannelId)?.name || 'Sconosciuto'}`
          : 'Seleziona canale di benvenuto'
      )
      .addOptions(channels);
    
    const row = new ActionRowBuilder().addComponents(selectMenu);
    
    return { embeds: [embed], components: [row] };
  } catch (error) {
    console.error('[welcome] buildDashboard error:', error);
    return {
      embeds: [
        new EmbedBuilder()
          .setTitle('❌ Errore')
          .setDescription('Impossibile caricare la dashboard.')
          .setColor('#FF0000')
      ],
      components: [],
    };
  }
}

// ========== GESTIONE UPDATE (chiamata dopo ogni modifica) ==========

async function updateDashboard(interaction) {
  try {
    const dashboardData = buildDashboard(interaction);
    
    // Aggiorna la risposta con la dashboard fresca
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(dashboardData);
    } else {
      await interaction.update(dashboardData);
    }
    
    return true;
  } catch (error) {
    console.error('[welcome] updateDashboard error:', error);
    
    try {
      const errorMsg = { 
        content: '❌ Errore durante l\'aggiornamento.', 
        embeds: [], 
        components: [] 
      };
      
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(errorMsg);
      } else {
        await interaction.reply({ ...errorMsg, ephemeral: true });
      }
    } catch (e) {
      console.error('[welcome] Failed to send error message:', e);
    }
    
    return false;
  }
}

// ========== HANDLER SELEZIONE CANALE ==========

async function handleChannelSelect(interaction) {
  try {
    const selectedChannelId = interaction.values?.[0];
    
    if (!selectedChannelId || selectedChannelId === 'none' || selectedChannelId === 'error') {
      await interaction.reply({ 
        content: '❌ Selezione non valida.', 
        ephemeral: true 
      });
      return;
    }
    
    // 1. Ottieni config corrente
    const cfg = ensureConfig(interaction);
    
    // 2. Aggiorna DB con nuovo canale
    cfg.welcomeChannelId = selectedChannelId;
    db.setGuildConfig(cfg.guildId, cfg);
    
    // 3. Aggiorna dashboard istantaneamente
    await updateDashboard(interaction);
    
  } catch (error) {
    console.error('[welcome] handleChannelSelect error:', error);
    
    try {
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ 
          content: '❌ Errore durante l\'aggiornamento del canale.', 
          ephemeral: true 
        });
      }
    } catch (e) {
      console.error('[welcome] Failed to send error:', e);
    }
  }
}

// ========== EXPORTS ==========

module.exports = {
  // Entry principale
  async execute(interaction) {
    try {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: true });
      }
      
      // Mostra dashboard
      const dashboardData = buildDashboard(interaction);
      await interaction.editReply(dashboardData);
      
    } catch (error) {
      console.error('[welcome] execute error:', error);
      
      try {
        const errorMsg = { 
          content: '❌ Errore nell\'esecuzione.', 
          embeds: [], 
          components: [] 
        };
        
        if (interaction.replied || interaction.deferred) {
          await interaction.editReply(errorMsg);
        } else {
          await interaction.reply({ ...errorMsg, ephemeral: true });
        }
      } catch (e) {
        console.error('[welcome] Failed to send error in execute:', e);
      }
    }
  },

  // Alias per compatibilità
  async handleWelcome(interaction) {
    return this.execute(interaction);
  },

  async showPanel(interaction) {
    return this.execute(interaction);
  },

  // Router componenti (solo select menu)
  async onComponent(interaction) {
    try {
      const customId = interaction.customId;
      
      if (customId === 'welcome_channel_select') {
        await handleChannelSelect(interaction);
      } else {
        // Componente sconosciuto, ignora
        console.warn('[welcome] Unknown component:', customId);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ 
            content: '❌ Componente non riconosciuto.', 
            ephemeral: true 
          });
        }
      }
    } catch (error) {
      console.error('[welcome] onComponent error:', error);
      
      try {
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({ 
            content: '❌ Errore nell\'interazione.', 
            ephemeral: true 
          });
        }
      } catch (e) {
        console.error('[welcome] Failed to send error in onComponent:', e);
      }
    }
  },

  // Modal handler (rimosso, non più necessario)
  async onModal(interaction) {
    try {
      console.warn('[welcome] Modal handler chiamato ma non più utilizzato');
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ 
          content: '❌ Funzionalità non disponibile.', 
          ephemeral: true 
        });
      }
    } catch (error) {
      console.error('[welcome] onModal error:', error);
    }
  },
};
