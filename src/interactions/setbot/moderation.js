// Dashboard Moderazione - Pattern reattivo centralizzato (ref: welcome.js, goodbye.js)
// Refactored: 2025-10-13 - Dashboard completamente reattiva con select moduli
// Pattern: buildDashboard centralizzato, updateDashboard, gestione undefined/errori, no doppie risposte
const db = require('../../database/db');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelType } = require('discord.js');
// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════
function getTextChannels(interaction) {
  try {
    return interaction.guild.channels.cache
      .filter(c => c.type === ChannelType.GuildText)
      .map(c => ({ label: `#${c.name}`, value: c.id }))
      .slice(0, 24);
  } catch (error) {
    console.error('[moderation] Error getting text channels:', error);
    return [];
  }
}
function ensureConfig(interaction) {
  // Ensure in-memory map exists
  if (!interaction.client.guildConfigs) interaction.client.guildConfigs = new Map();
  let cfg = interaction.client.guildConfigs.get(interaction.guildId);
  if (!cfg) {
    cfg = {
      guildId: interaction.guildId,
      moderationEnabled: false,
      moderationLogChannelId: null,
      moderationAutomodEnabled: false
    };
    interaction.client.guildConfigs.set(interaction.guildId, cfg);
  }
  // Gestisci undefined per tutte le proprietà
  if (cfg.moderationEnabled === undefined) cfg.moderationEnabled = false;
  if (cfg.moderationLogChannelId === undefined) cfg.moderationLogChannelId = null;
  if (cfg.moderationAutomodEnabled === undefined) cfg.moderationAutomodEnabled = false;
  return cfg;
}
// ═══════════════════════════════════════════════════════════════
// DASHBOARD CENTRALIZZATO - Pattern come welcome/goodbye
// ═══════════════════════════════════════════════════════════════
function buildDashboard(interaction) {
  try {
    const cfg = ensureConfig(interaction);
    const channels = getTextChannels(interaction);
    // Embed con tutte le variabili mostrate subito
    const embed = new EmbedBuilder()
      .setTitle('⚙️ Dashboard Moderazione')
      .setColor(cfg.moderationEnabled ? '#43B581' : '#ED4245')
      .setDescription(
        `**Sistema:** ${cfg.moderationEnabled ? '🟢 Attivo' : '🔴 Disattivo'}\n` +
        `**Canale Log:** ${cfg.moderationLogChannelId ? `<#${cfg.moderationLogChannelId}>` : '❌ Nessuno'}\n` +
        `**Automod:** ${cfg.moderationAutomodEnabled ? '✅ Attivo' : '❌ Disattivo'}`
      )
      .setFooter({ text: 'Usa il menu per modificare le impostazioni' })
      .setTimestamp();
    // Solo select menu dei moduli (niente bottoni extra)
    const options = [
      {
        label: 'Toggle Sistema Moderazione',
        value: 'moderation_toggle',
        description: cfg.moderationEnabled ? 'Disattiva il sistema' : 'Attiva il sistema',
        emoji: cfg.moderationEnabled ? '🔴' : '🟢'
      },
      {
        label: 'Toggle Automod',
        value: 'moderation_toggle_automod',
        description: cfg.moderationAutomodEnabled ? 'Disattiva automod' : 'Attiva automod',
        emoji: '🤖'
      }
    ];
    // Aggiungi opzione canale log se ci sono canali
    if (channels.length > 0) {
      options.push({
        label: 'Seleziona Canale Log',
        value: 'moderation_select_log_channel',
        description: 'Imposta il canale per i log di moderazione',
        emoji: '📝'
      });
    }
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('moderation_config_select')
      .setPlaceholder('Seleziona azione da configurare')
      .addOptions(options);
    const row = new ActionRowBuilder().addComponents(selectMenu);
    return { embeds: [embed], components: [row] };
  } catch (error) {
    console.error('[moderation] Error building dashboard:', error);
    const errorEmbed = new EmbedBuilder()
      .setTitle('❌ Errore Dashboard')
      .setDescription('Si è verificato un errore nel caricamento della dashboard.')
      .setColor('#ED4245');
    return { embeds: [errorEmbed], components: [] };
  }
}
async function updateDashboard(interaction) {
  try {
    const payload = buildDashboard(interaction);
    if (interaction.replied || interaction.deferred) {
      return await interaction.editReply(payload);
    } else {
      return await interaction.update(payload);
    }
  } catch (error) {
    console.error('[moderation] Error updating dashboard:', error);
    // Previeni risposte doppie - tenta solo se non già risposto
    if (!interaction.replied && !interaction.deferred) {
      try {
        await interaction.reply({ content: '❌ Errore aggiornamento dashboard', ephemeral: true });
      } catch (e) {
        console.error('[moderation] Failed to send error message:', e);
      }
    }
  }
}
// ═══════════════════════════════════════════════════════════════
// GESTIONE SELEZIONE CANALE LOG - Submenu
// ═══════════════════════════════════════════════════════════════
async function showChannelSelectMenu(interaction) {
  try {
    await interaction.deferUpdate();
    const channels = getTextChannels(interaction);
    
    if (channels.length === 0) {
      return await interaction.editReply({
        content: '❌ Nessun canale di testo disponibile',
        components: []
      });
    }
    const embed = new EmbedBuilder()
      .setTitle('📝 Seleziona Canale Log')
      .setDescription('Scegli il canale dove verranno inviati i log di moderazione')
      .setColor('#3498db');
    const channelMenu = new StringSelectMenuBuilder()
      .setCustomId('moderation_channel_log_select')
      .setPlaceholder('Seleziona canale log')
      .addOptions([{ label: '❌ Nessuno (disabilita log)', value: 'none' }, ...channels]);
    const backBtn = new StringSelectMenuBuilder()
      .setCustomId('moderation_config_select')
      .setPlaceholder('← Torna alla dashboard')
      .addOptions([{ label: '← Torna indietro', value: 'back_to_dashboard', emoji: '↩️' }]);
    const row1 = new ActionRowBuilder().addComponents(channelMenu);
    const row2 = new ActionRowBuilder().addComponents(backBtn);
    return await interaction.editReply({ embeds: [embed], components: [row1, row2] });
  } catch (error) {
    console.error('[moderation] Error showing channel select:', error);
    return updateDashboard(interaction);
  }
}
// ═══════════════════════════════════════════════════════════════
// HANDLERS - Aggiornamento live ad ogni azione
// ═══════════════════════════════════════════════════════════════
async function handleToggleModeration(interaction) {
  try {
    await interaction.deferUpdate();
    const cfg = ensureConfig(interaction);
    const newVal = !cfg.moderationEnabled;
    
    // Update DB prima
    await db.updateGuildConfig(interaction.guildId, { moderationEnabled: newVal });
    
    // Rebuild config
    const freshCfg = await db.getGuildConfig(interaction.guildId);
    if (freshCfg) {
      if (!interaction.client.guildConfigs) interaction.client.guildConfigs = new Map();
      interaction.client.guildConfigs.set(interaction.guildId, freshCfg);
    }
    
    // Aggiorna dashboard live
    return await updateDashboard(interaction);
  } catch (error) {
    console.error('[moderation] Error toggling moderation:', error);
    if (!interaction.replied) {
      await interaction.reply({ content: '❌ Errore durante il toggle', ephemeral: true });
    }
  }
}
async function handleToggleAutomod(interaction) {
  try {
    await interaction.deferUpdate();
    const cfg = ensureConfig(interaction);
    const newVal = !cfg.moderationAutomodEnabled;
    
    // Update DB prima
    await db.updateGuildConfig(interaction.guildId, { moderationAutomodEnabled: newVal });
    
    // Rebuild config
    const freshCfg = await db.getGuildConfig(interaction.guildId);
    if (freshCfg) {
      if (!interaction.client.guildConfigs) interaction.client.guildConfigs = new Map();
      interaction.client.guildConfigs.set(interaction.guildId, freshCfg);
    }
    
    // Aggiorna dashboard live
    return await updateDashboard(interaction);
  } catch (error) {
    console.error('[moderation] Error toggling automod:', error);
    if (!interaction.replied) {
      await interaction.reply({ content: '❌ Errore durante il toggle automod', ephemeral: true });
    }
  }
}
async function handleChannelLogSelect(interaction) {
  try {
    await interaction.deferUpdate();
    const cfg = ensureConfig(interaction);
    const channelId = interaction.values?.[0];
    const finalChannelId = (channelId === 'none') ? null : channelId;
    
    // Update DB prima
    await db.updateGuildConfig(interaction.guildId, { moderationLogChannelId: finalChannelId });
    
    // Rebuild config
    const freshCfg = await db.getGuildConfig(interaction.guildId);
    if (freshCfg) {
      if (!interaction.client.guildConfigs) interaction.client.guildConfigs = new Map();
      interaction.client.guildConfigs.set(interaction.guildId, freshCfg);
    }
    
    // Torna alla dashboard principale
    return await updateDashboard(interaction);
  } catch (error) {
    console.error('[moderation] Error selecting channel:', error);
    if (!interaction.replied) {
      await interaction.reply({ content: '❌ Errore durante la selezione del canale', ephemeral: true });
    }
  }
}
// ═══════════════════════════════════════════════════════════════
// EXPORTS - Router componenti
// ═══════════════════════════════════════════════════════════════
module.exports = {
  // Entrypoint principale
  async execute(interaction) {
    if (typeof this.showPanel === 'function') return this.showPanel(interaction);
    if (typeof this.handleModeration === 'function') return this.handleModeration(interaction);
    return interaction.reply({ content: '❌ Dashboard modulo non implementata correttamente!', ephemeral: true });
  },
  // Mostra dashboard principale
  async handleModeration(interaction) {
    try {
      const payload = buildDashboard(interaction);
      if (interaction.replied || interaction.deferred) {
        return await interaction.editReply(payload);
      }
      return await interaction.reply({ ...payload, ephemeral: true });
    } catch (error) {
      console.error('[moderation] Error in handleModeration:', error);
      if (!interaction.replied) {
        await interaction.reply({ content: '❌ Errore caricamento dashboard', ephemeral: true });
      }
    }
  },
  // Router per select menu e componenti
  async onComponent(interaction) {
    try {
      const id = interaction.customId;
      
      // Select menu principale
      if (id === 'moderation_config_select') {
        const value = interaction.values?.[0];
        
        if (value === 'moderation_toggle') {
          return await handleToggleModeration(interaction);
        }
        if (value === 'moderation_toggle_automod') {
          return await handleToggleAutomod(interaction);
        }
        if (value === 'moderation_select_log_channel') {
          return await showChannelSelectMenu(interaction);
        }
        if (value === 'back_to_dashboard') {
          await interaction.deferUpdate();
          return await updateDashboard(interaction);
        }
      }
      
      // Select canale log (submenu)
      if (id === 'moderation_channel_log_select') {
        return await handleChannelLogSelect(interaction);
      }
      
      // Fallback: torna alla dashboard
      await interaction.deferUpdate();
      return await updateDashboard(interaction);
    } catch (error) {
      console.error('[moderation] Error in onComponent:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: '❌ Errore gestione componente', ephemeral: true });
      }
    }
  },
  // Router modals (non usato per ora)
  async onModal(interaction) {
    try {
      return await interaction.reply({ content: 'Modal non supportata in questo modulo.', ephemeral: true });
    } catch (error) {
      console.error('[moderation] Error in onModal:', error);
    }
  },
  // Alias per compatibilità con setbot.js
  async showPanel(interaction) {
    return this.handleModeration(interaction);
  }
};
