// Patch: questa dashboard aggiorna in real-time dopo ogni interazione. Sequenza: deferUpdate > update DB > rebuild config > buildDashboard > editReply
// Refactored: 2025-10-12 - Dashboard goodbye con aggiornamento live immediato
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
    console.error('[goodbye] Error fetching channels:', error);
    return [];
  }
}

// Helper: ensure config
function ensureConfig(interaction) {
  let cfg = interaction.client.guildConfigs.get(interaction.guildId);
  if (!cfg) {
    cfg = {
      guildId: interaction.guildId,
      goodbyeEnabled: false,
      goodbyeChannelId: null,
      goodbyeMessage: 'Addio {user}!'
    };
    interaction.client.guildConfigs.set(interaction.guildId, cfg);
  }
  if (cfg.goodbyeMessage === undefined) cfg.goodbyeMessage = 'Addio {user}!';
  return cfg;
}

// Build dashboard embed + components
function buildDashboard(interaction) {
  const cfg = ensureConfig(interaction);
  const channels = getTextChannels(interaction);
  
  const embed = new EmbedBuilder()
    .setTitle('⚙️ Configurazione: Goodbye')
    .setColor(cfg.goodbyeEnabled ? '#43B581' : '#ED4245')
    .addFields(
      { name: 'Canale Addio', value: cfg.goodbyeChannelId ? `<#${cfg.goodbyeChannelId}>` : 'Non impostato', inline: false },
      { name: 'Messaggio', value: cfg.goodbyeMessage || 'Addio {user}!', inline: false },
      { name: 'Sistema', value: cfg.goodbyeEnabled ? '🟢 ON' : '🔴 OFF', inline: false }
    );

  const rows = [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('goodbye_channel_select')
        .setPlaceholder(cfg.goodbyeChannelId ? 'Canale impostato' : 'Seleziona canale addio')
        .addOptions([{ label: 'Nessuno', value: 'none' }, ...channels])
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('goodbye_set_message')
        .setLabel('Imposta Messaggio')
        .setStyle(1)
        .setEmoji('✏️'),
      new ButtonBuilder()
        .setCustomId('goodbye_toggle')
        .setLabel(cfg.goodbyeEnabled ? 'Disattiva' : 'Attiva')
        .setStyle(cfg.goodbyeEnabled ? 4 : 3)
        .setEmoji(cfg.goodbyeEnabled ? '🔴' : '🟢')
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
    cfg.goodbyeChannelId = value === 'none' ? null : value;
    
    // PATCH: update DB prima
    await db.updateGuildConfig(interaction.guildId, { goodbyeChannelId: cfg.goodbyeChannelId });
    
    // PATCH: rebuild config subito prima del dashboard
    const freshCfg = await db.getGuildConfig(interaction.guildId);
    if (freshCfg) {
      interaction.client.guildConfigs.set(interaction.guildId, freshCfg);
    }
    
    const { embed, rows } = buildDashboard(interaction);
    // PATCH: usa editReply invece di reply
    return interaction.editReply({ embeds: [embed], components: rows });
  } catch (error) {
    console.error('[goodbye] Error in handleSelect:', error);
    return interaction.editReply({ content: '❌ Errore durante l\'aggiornamento del canale.', embeds: [], components: [] }).catch(() => {});
  }
}

// Handle buttons
async function handleComponent(interaction) {
  const id = interaction.customId;
  
  try {
    if (id === 'goodbye_toggle') {
      // PATCH: sempre deferUpdate all'inizio
      await interaction.deferUpdate();
      
      const cfg = ensureConfig(interaction);
      cfg.goodbyeEnabled = !cfg.goodbyeEnabled;
      
      // PATCH: update DB prima
      await db.updateGuildConfig(interaction.guildId, { goodbyeEnabled: cfg.goodbyeEnabled });
      
      // PATCH: rebuild config subito prima del dashboard
      const freshCfg = await db.getGuildConfig(interaction.guildId);
      if (freshCfg) {
        interaction.client.guildConfigs.set(interaction.guildId, freshCfg);
      }
      
      const { embed, rows } = buildDashboard(interaction);
      // PATCH: usa editReply
      return interaction.editReply({ embeds: [embed], components: rows });
    }
    
    if (id === 'goodbye_set_message') {
      const modal = new ModalBuilder()
        .setCustomId('goodbye_message_modal')
        .setTitle('Imposta Messaggio Goodbye');
      
      const input = new TextInputBuilder()
        .setCustomId('goodbye_message_input')
        .setLabel('Messaggio (usa {user} per menzionare)')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Addio {user}!')
        .setRequired(true)
        .setValue(ensureConfig(interaction).goodbyeMessage || 'Addio {user}!');
      
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      return interaction.showModal(modal);
    }
  } catch (error) {
    console.error(`[goodbye] Error in handleComponent (${id}):`, error);
    return interaction.editReply({ content: '❌ Errore durante l\'operazione.', embeds: [], components: [] }).catch(() => {});
  }
}

// Handle modal submits
async function handleModals(interaction) {
  try {
    if (interaction.customId === 'goodbye_message_modal') {
      // PATCH: sempre deferUpdate all'inizio
      await interaction.deferUpdate();
      
      const msg = interaction.fields.getTextInputValue('goodbye_message_input');
      const cfg = ensureConfig(interaction);
      cfg.goodbyeMessage = msg;
      
      // PATCH: update DB prima
      await db.updateGuildConfig(interaction.guildId, { goodbyeMessage: msg });
      
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
    console.error('[goodbye] Error in handleModals:', error);
    return interaction.editReply({ content: '❌ Errore durante l\'aggiornamento del messaggio.', embeds: [], components: [] }).catch(() => {});
  }
}

module.exports = {
  // Entrypoint to render dashboard
  async handleGoodbye(interaction) {
    try {
      const { embed, rows } = buildDashboard(interaction);
      if (interaction.replied || interaction.deferred) {
        return interaction.editReply({ embeds: [embed], components: rows });
      }
      return interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
    } catch (error) {
      console.error('[goodbye] Error in handleGoodbye:', error);
      return interaction.reply({ content: '❌ Errore nel caricamento della dashboard.', ephemeral: true }).catch(() => {});
    }
  },
  
  // Router for selects/buttons
  async onComponent(interaction) {
    try {
      const id = interaction.customId;
      if (id === 'goodbye_channel_select') {
        const v = interaction.values?.[0];
        return handleSelect(interaction, v);
      }
      return handleComponent(interaction);
    } catch (error) {
      console.error('[goodbye] Error in onComponent:', error);
      return interaction.reply({ content: '❌ Errore nell\'interazione.', ephemeral: true }).catch(() => {});
    }
  },
  
  // Router for modals
  async onModal(interaction) {
    try {
      return handleModals(interaction);
    } catch (error) {
      console.error('[goodbye] Error in onModal:', error);
      return interaction.reply({ content: '❌ Errore nella gestione del modal.', ephemeral: true }).catch(() => {});
    }
  }
};
