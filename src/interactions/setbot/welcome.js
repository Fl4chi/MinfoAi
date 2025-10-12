// Patch: questa dashboard aggiorna in real-time dopo ogni interazione. Sequenza: deferUpdate > update DB > rebuild config > buildDashboard > editReply
// Refactored: 2025-10-12 - Dashboard welcome con aggiornamento live immediato
const db = require('../../database/db');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType } = require('discord.js');

// Helper: get channels
function getTextChannels(interaction) {
  try {
    return interaction.guild.channels.cache
      .filter(c => c.type === ChannelType.GuildText)
      .map(c => ({ label: `#${c.name}`, value: c.id }))
      .slice(0, 24);
  } catch (error) {
    console.error('[welcome] Error fetching channels:', error);
    return [];
  }
}

// Helper: ensure config
function ensureConfig(interaction) {
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
  if (cfg.welcomeMessage === undefined) cfg.welcomeMessage = '{user}';
  return cfg;
}

// Build dashboard embed + components
function buildDashboard(interaction) {
  const cfg = ensureConfig(interaction);
  const channels = getTextChannels(interaction);
  
  const embed = new EmbedBuilder()
    .setTitle('⚙️ Configurazione: Welcome')
    .setColor(cfg.welcomeEnabled ? '#43B581' : '#ED4245')
    .addFields(
      { name: 'Canale Benvenuto', value: cfg.welcomeChannelId ? `<#${cfg.welcomeChannelId}>` : 'Non impostato', inline: false },
      { name: 'Messaggio', value: cfg.welcomeMessage || '{user}', inline: false },
      { name: 'Sistema', value: cfg.welcomeEnabled ? '🟢 ON' : '🔴 OFF', inline: false }
    );

  const rows = [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('welcome_channel_select')
        .setPlaceholder(cfg.welcomeChannelId ? 'Canale impostato' : 'Seleziona canale benvenuto')
        .addOptions([{ label: 'Nessuno', value: 'none' }, ...channels])
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
    if (freshCfg) {
      interaction.client.guildConfigs.set(interaction.guildId, freshCfg);
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
      if (freshCfg) {
        interaction.client.guildConfigs.set(interaction.guildId, freshCfg);
      }
      
      const { embed, rows } = buildDashboard(interaction);
      // PATCH: usa editReply
      return interaction.editReply({ embeds: [embed], components: rows });
    }
    
    if (id === 'welcome_set_message') {
      const modal = new ModalBuilder()
        .setCustomId('welcome_message_modal')
        .setTitle('Imposta Messaggio Welcome');
      
      const input = new TextInputBuilder()
        .setCustomId('welcome_message_input')
        .setLabel('Messaggio (usa {user} per menzionare)')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Benvenuto {user}!')
        .setRequired(true)
        .setValue(ensureConfig(interaction).welcomeMessage || '{user}');
      
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
      if (freshCfg) {
        interaction.client.guildConfigs.set(interaction.guildId, freshCfg);
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
  
  // Router for selects/buttons
  async onComponent(interaction) {
    try {
      const id = interaction.customId;
      if (id === 'welcome_channel_select') {
        const v = interaction.values?.[0];
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
