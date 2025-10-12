// Patch: questa dashboard aggiorna in real-time dopo ogni interazione. Sequenza: deferUpdate > update DB > rebuild config > buildDashboard > editReply
// Refactored: 2025-10-12 - Dashboard giveaway con aggiornamento live immediato
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
    console.error('[giveaway] Error fetching channels:', error);
    return [];
  }
}

// Helper: ensure config
function ensureConfig(interaction) {
  let cfg = interaction.client.guildConfigs.get(interaction.guildId);
  if (!cfg) {
    cfg = {
      guildId: interaction.guildId,
      giveawayEnabled: false,
      giveawayChannelId: null,
      giveawayDuration: 86400
    };
    interaction.client.guildConfigs.set(interaction.guildId, cfg);
  }
  if (cfg.giveawayDuration === undefined) cfg.giveawayDuration = 86400;
  return cfg;
}

// Build dashboard embed + components
function buildDashboard(interaction) {
  const cfg = ensureConfig(interaction);
  const channels = getTextChannels(interaction);
  
  const embed = new EmbedBuilder()
    .setTitle('⚙️ Configurazione: Giveaway')
    .setColor(cfg.giveawayEnabled ? '#43B581' : '#ED4245')
    .addFields(
      { name: 'Canale Giveaway', value: cfg.giveawayChannelId ? `<#${cfg.giveawayChannelId}>` : 'Non impostato', inline: false },
      { name: 'Durata Default', value: `${cfg.giveawayDuration || 86400} secondi`, inline: true },
      { name: 'Sistema', value: cfg.giveawayEnabled ? '🟢 ON' : '🔴 OFF', inline: true }
    );

  const rows = [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('giveaway_channel_select')
        .setPlaceholder(cfg.giveawayChannelId ? 'Canale impostato' : 'Seleziona canale giveaway')
        .addOptions([{ label: 'Nessuno', value: 'none' }, ...channels])
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('giveaway_set_duration')
        .setLabel('Imposta Durata')
        .setStyle(1)
        .setEmoji('⏰'),
      new ButtonBuilder()
        .setCustomId('giveaway_toggle')
        .setLabel(cfg.giveawayEnabled ? 'Disabilita' : 'Abilita')
        .setStyle(cfg.giveawayEnabled ? 4 : 3)
        .setEmoji(cfg.giveawayEnabled ? '🔴' : '🟢'),
      new ButtonBuilder()
        .setCustomId('giveaway_publish')
        .setLabel('Pubblica Giveaway')
        .setStyle(1)
        .setEmoji('🎉')
        .setDisabled(!cfg.giveawayEnabled || !cfg.giveawayChannelId)
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
    cfg.giveawayChannelId = value === 'none' ? null : value;
    
    // PATCH: update DB prima
    await db.updateGuildConfig(interaction.guildId, { giveawayChannelId: cfg.giveawayChannelId });
    
    // PATCH: rebuild config subito prima del dashboard
    const freshCfg = await db.getGuildConfig(interaction.guildId);
    if (freshCfg) {
      interaction.client.guildConfigs.set(interaction.guildId, freshCfg);
    }
    
    const { embed, rows } = buildDashboard(interaction);
    // PATCH: usa editReply invece di reply
    return interaction.editReply({ embeds: [embed], components: rows });
  } catch (error) {
    console.error('[giveaway] Error in handleSelect:', error);
    return interaction.editReply({ content: '❌ Errore durante l\'aggiornamento del canale.', embeds: [], components: [] }).catch(() => {});
  }
}

// Handle buttons
async function handleComponent(interaction) {
  const id = interaction.customId;
  
  try {
    if (id === 'giveaway_toggle') {
      // PATCH: sempre deferUpdate all'inizio
      await interaction.deferUpdate();
      
      const cfg = ensureConfig(interaction);
      cfg.giveawayEnabled = !cfg.giveawayEnabled;
      
      // PATCH: update DB prima
      await db.updateGuildConfig(interaction.guildId, { giveawayEnabled: cfg.giveawayEnabled });
      
      // PATCH: rebuild config subito prima del dashboard
      const freshCfg = await db.getGuildConfig(interaction.guildId);
      if (freshCfg) {
        interaction.client.guildConfigs.set(interaction.guildId, freshCfg);
      }
      
      const { embed, rows } = buildDashboard(interaction);
      // PATCH: usa editReply
      return interaction.editReply({ embeds: [embed], components: rows });
    }
    
    if (id === 'giveaway_publish') {
      // PATCH: sempre deferUpdate all'inizio
      await interaction.deferUpdate();
      
      const cfg = ensureConfig(interaction);
      if (!cfg.giveawayEnabled || !cfg.giveawayChannelId) {
        return interaction.editReply({ content: '❌ Configura prima il canale e abilita il sistema.', embeds: [], components: [] });
      }
      
      const channel = interaction.guild.channels.cache.get(cfg.giveawayChannelId);
      if (!channel) {
        return interaction.editReply({ content: '❌ Canale non trovato.', embeds: [], components: [] });
      }
      
      // Pubblica messaggio di giveaway
      const giveawayEmbed = new EmbedBuilder()
        .setTitle('🎉 Nuovo Giveaway!')
        .setDescription('Reagisci con 🎉 per partecipare!')
        .setColor('#43B581')
        .setTimestamp();
      
      await channel.send({ embeds: [giveawayEmbed] });
      
      // PATCH: rebuild config subito prima del dashboard
      const freshCfg = await db.getGuildConfig(interaction.guildId);
      if (freshCfg) {
        interaction.client.guildConfigs.set(interaction.guildId, freshCfg);
      }
      
      const { embed, rows } = buildDashboard(interaction);
      // PATCH: usa editReply
      return interaction.editReply({ embeds: [embed], components: rows });
    }
    
    if (id === 'giveaway_set_duration') {
      const modal = new ModalBuilder()
        .setCustomId('giveaway_duration_modal')
        .setTitle('Imposta Durata Default');
      
      const input = new TextInputBuilder()
        .setCustomId('giveaway_duration_input')
        .setLabel('Durata in secondi')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('86400 (24 ore)')
        .setRequired(true)
        .setValue(String(ensureConfig(interaction).giveawayDuration || 86400));
      
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      return interaction.showModal(modal);
    }
  } catch (error) {
    console.error(`[giveaway] Error in handleComponent (${id}):`, error);
    return interaction.editReply({ content: '❌ Errore durante l\'operazione.', embeds: [], components: [] }).catch(() => {});
  }
}

// Handle modal submits
async function handleModals(interaction) {
  try {
    if (interaction.customId === 'giveaway_duration_modal') {
      // PATCH: sempre deferUpdate all'inizio
      await interaction.deferUpdate();
      
      const duration = parseInt(interaction.fields.getTextInputValue('giveaway_duration_input')) || 86400;
      const cfg = ensureConfig(interaction);
      cfg.giveawayDuration = duration;
      
      // PATCH: update DB prima
      await db.updateGuildConfig(interaction.guildId, { giveawayDuration: duration });
      
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
    console.error('[giveaway] Error in handleModals:', error);
    return interaction.editReply({ content: '❌ Errore durante l\'aggiornamento della durata.', embeds: [], components: [] }).catch(() => {});
  }
}

module.exports = {
  // Entrypoint to render dashboard
  async handleGiveaway(interaction) {
    try {
      const { embed, rows } = buildDashboard(interaction);
      if (interaction.replied || interaction.deferred) {
        return interaction.editReply({ embeds: [embed], components: rows });
      }
      return interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
    } catch (error) {
      console.error('[giveaway] Error in handleGiveaway:', error);
      return interaction.reply({ content: '❌ Errore nel caricamento della dashboard.', ephemeral: true }).catch(() => {});
    }
  },
  
  // Router for selects/buttons
  async onComponent(interaction) {
    try {
      const id = interaction.customId;
      if (id === 'giveaway_channel_select') {
        const v = interaction.values?.[0];
        return handleSelect(interaction, v);
      }
      return handleComponent(interaction);
    } catch (error) {
      console.error('[giveaway] Error in onComponent:', error);
      return interaction.reply({ content: '❌ Errore nell\'interazione.', ephemeral: true }).catch(() => {});
    }
  },
  
  // Router for modals
  async onModal(interaction) {
    try {
      return handleModals(interaction);
    } catch (error) {
      console.error('[giveaway] Error in onModal:', error);
      return interaction.reply({ content: '❌ Errore nella gestione del modal.', ephemeral: true }).catch(() => {});
    }
  }
};
