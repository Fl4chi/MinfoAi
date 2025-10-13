// Patch: questa dashboard aggiorna in real-time dopo ogni interazione. Sequenza: deferUpdate > update DB > rebuild config > buildDashboard > editReply
// Refactored: 2025-10-12 - Dashboard welcome con aggiornamento live immediato
// Fixed: 2025-10-13 - Robust client.guildConfigs initialization and error handling
const db = require('../../database/db');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType } = require('discord.js');

// Helper: get channels
function getTextChannels(interaction) {
  try {
    // Fix: Add null checks to prevent TypeError get
    if (!interaction || !interaction.guild || !interaction.guild.channels || !interaction.guild.channels.cache) {
      console.error('[welcome] Missing guild or channels in interaction');
      return [];
    }
    
    return interaction.guild.channels.cache
      .filter(c => c && c.type === ChannelType.GuildText)
      .map(c => ({ label: `#${c.name}`, value: c.id }))
      .slice(0, 24);
  } catch (error) {
    console.error('[welcome] Error fetching channels:', error);
    return [];
  }
}

// Helper: ensure config
function ensureConfig(interaction) {
  try {
    // CRITICAL: Initialize client.guildConfigs if missing to prevent 'Cannot read property set of undefined'
    if (!interaction || !interaction.client) {
      console.error('[welcome] Missing client in interaction');
      return {
        guildId: interaction?.guildId || null,
        welcomeEnabled: false,
        welcomeChannelId: null,
        welcomeMessage: '{user}'
      };
    }
    
    // Initialize guildConfigs Map if it doesn't exist (first startup)
    if (!interaction.client.guildConfigs) {
      console.log('[welcome] Initializing client.guildConfigs Map (first startup)');
      interaction.client.guildConfigs = new Map();
    }
    
    // Validate guildConfigs is actually a Map
    if (!(interaction.client.guildConfigs instanceof Map)) {
      console.warn('[welcome] guildConfigs is not a Map, reinitializing');
      interaction.client.guildConfigs = new Map();
    }
    
    let cfg = interaction.client.guildConfigs.get(interaction.guildId);
    if (!cfg) {
      cfg = {
        guildId: interaction.guildId,
        welcomeEnabled: false,
        welcomeChannelId: null,
        welcomeMessage: '{user}'
      };
      interaction.client.guildConfigs.set(interaction.guildId, cfg);
    }
    
    // Ensure all required properties exist
    if (cfg.welcomeMessage === undefined) cfg.welcomeMessage = '{user}';
    if (cfg.welcomeEnabled === undefined) cfg.welcomeEnabled = false;
    if (cfg.welcomeChannelId === undefined) cfg.welcomeChannelId = null;
    
    return cfg;
  } catch (error) {
    console.error('[welcome] Error in ensureConfig:', error);
    return {
      guildId: interaction?.guildId || null,
      welcomeEnabled: false,
      welcomeChannelId: null,
      welcomeMessage: '{user}'
    };
  }
}

// Build dashboard embed + components
function buildDashboard(interaction) {
  try {
    const cfg = ensureConfig(interaction);
    const channels = getTextChannels(interaction);
    
    // Fix: Add validation for channels array
    const channelOptions = channels && channels.length > 0 ? channels : [];
    
    const embed = new EmbedBuilder()
      .setTitle('⚙️ Configurazione: Welcome')
      .setColor(cfg.welcomeEnabled ? '#43B581' : '#ED4245')
      .addFields(
        { name: 'Canale Benvenuto', value: cfg.welcomeChannelId ? `<#${cfg.welcomeChannelId}>` : 'Non impostato', inline: false },
        { name: 'Messaggio', value: cfg.welcomeMessage || '{user}', inline: false },
        { name: 'Sistema', value: cfg.welcomeEnabled ? '🟢 ON' : '🔴 OFF', inline: false }
      );
      
    // Fix: Ensure we always have at least the 'Nessuno' option
    const selectOptions = [{ label: 'Nessuno', value: 'none' }, ...channelOptions];
    
    const rows = [
      new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('welcome_channel_select')
          .setPlaceholder(cfg.welcomeChannelId ? 'Canale impostato' : 'Seleziona canale benvenuto')
          .addOptions(selectOptions)
      ),
      new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('welcome_set_message')
          .setLabel('Imposta Messaggio')
          .setStyle(1)
          .setEmoji('✏️'),
        new ButtonBuilder()
          .setCustomId('welcome_toggle')
          .setLabel(cfg.welcomeEnabled ? 'Disattiva' : 'Attiva')
          .setStyle(cfg.welcomeEnabled ? 4 : 3)
          .setEmoji(cfg.welcomeEnabled ? '🔴' : '🟢')
      )
    ];
    return { embed, rows };
  } catch (error) {
    console.error('[welcome] Error in buildDashboard:', error);
    // Return a basic dashboard in case of error
    const errorEmbed = new EmbedBuilder()
      .setTitle('⚙️ Configurazione: Welcome')
      .setColor('#ED4245')
      .setDescription('❌ Errore nel caricamento della configurazione');
    return { embed: errorEmbed, rows: [] };
  }
}

// Handle select menus
async function handleSelect(interaction, value) {
  try {
    // PATCH: sempre deferUpdate all'inizio
    await interaction.deferUpdate();
    
    const cfg = ensureConfig(interaction);
    cfg.welcomeChannelId = value === 'none' ? null : value;
    
    // PATCH: update DB prima
    await db.updateGuildConfig(interaction.guildId, { welcomeChannelId: cfg.welcomeChannelId });
    
    // PATCH: rebuild config subito prima del dashboard
    const freshCfg = await db.getGuildConfig(interaction.guildId);
    if (freshCfg && interaction.client.guildConfigs) {
      // Fix: Ensure proper merge of fresh config
      Object.assign(cfg, freshCfg);
      interaction.client.guildConfigs.set(interaction.guildId, cfg);
    }
    
    const { embed, rows } = buildDashboard(interaction);
    // PATCH: usa editReply invece di reply
    return interaction.editReply({ embeds: [embed], components: rows });
  } catch (error) {
    console.error('[welcome] Error in handleSelect:', error);
    return interaction.editReply({ content: '❌ Errore durante l\'aggiornamento del canale.', embeds: [], components: [] }).catch(() => {});
  }
}

// Handle buttons
async function handleComponent(interaction) {
  const id = interaction.customId;
  
  try {
    if (id === 'welcome_toggle') {
      // PATCH: sempre deferUpdate all'inizio
      await interaction.deferUpdate();
      
      const cfg = ensureConfig(interaction);
      cfg.welcomeEnabled = !cfg.welcomeEnabled;
      
      // PATCH: update DB prima
      await db.updateGuildConfig(interaction.guildId, { welcomeEnabled: cfg.welcomeEnabled });
      
      // PATCH: rebuild config subito prima del dashboard
      const freshCfg = await db.getGuildConfig(interaction.guildId);
      if (freshCfg && interaction.client.guildConfigs) {
        // Fix: Ensure proper merge of fresh config
        Object.assign(cfg, freshCfg);
        interaction.client.guildConfigs.set(interaction.guildId, cfg);
      }
      
      const { embed, rows } = buildDashboard(interaction);
      // PATCH: usa editReply
      return interaction.editReply({ embeds: [embed], components: rows });
    }
    
    if (id === 'welcome_set_message') {
      const currentCfg = ensureConfig(interaction);
      const modal = new ModalBuilder()
        .setCustomId('welcome_message_modal')
        .setTitle('Imposta Messaggio Welcome');
      
      const input = new TextInputBuilder()
        .setCustomId('welcome_message_input')
        .setLabel('Messaggio (usa {user} per menzionare)')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Benvenuto {user}!')
        .setRequired(true)
        .setValue(currentCfg.welcomeMessage || '{user}');
      
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      return interaction.showModal(modal);
    }
  } catch (error) {
    console.error(`[welcome] Error in handleComponent (${id}):`, error);
    return interaction.editReply({ content: '❌ Errore durante l\'operazione.', embeds: [], components: [] }).catch(() => {});
  }
}

// Handle modal submits
async function handleModals(interaction) {
  try {
    if (interaction.customId === 'welcome_message_modal') {
      // PATCH: sempre deferUpdate all'inizio
      await interaction.deferUpdate();
      
      const msg = interaction.fields.getTextInputValue('welcome_message_input');
      const cfg = ensureConfig(interaction);
      cfg.welcomeMessage = msg;
      
      // PATCH: update DB prima
      await db.updateGuildConfig(interaction.guildId, { welcomeMessage: msg });
      
      // PATCH: rebuild config subito prima del dashboard
      const freshCfg = await db.getGuildConfig(interaction.guildId);
      if (freshCfg && interaction.client.guildConfigs) {
        // Fix: Ensure proper merge of fresh config
        Object.assign(cfg, freshCfg);
        interaction.client.guildConfigs.set(interaction.guildId, cfg);
      }
      
      const { embed, rows } = buildDashboard(interaction);
      // PATCH: usa editReply
      return interaction.editReply({ embeds: [embed], components: rows });
    }
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
          console.error('[welcome] No value selected in channel select');
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
  }
};
