// Patch: questa dashboard aggiorna in real-time dopo ogni interazione. Sequenza: deferUpdate -> update DB -> rebuild config -> buildDashboard -> editReply
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
  const chOptions = getTextChannels(interaction);
  const embed = new EmbedBuilder()
    .setTitle('⚙️ Dashboard Goodbye')
    .setColor(cfg.goodbyeEnabled ? 0x00FF00 : 0xFF0000)
    .setDescription(
      `**Status:** ${cfg.goodbyeEnabled ? '✅ Attivo' : '❌ Disattivo'}\n` +
      `**Canale:** ${cfg.goodbyeChannelId ? `<#${cfg.goodbyeChannelId}>` : 'Nessuno'}\n` +
      `**Messaggio:**\n\`\`\`${cfg.goodbyeMessage || 'Nessuno'}\`\`\`\n` +
      `*Variabili disponibili:* \`{user}\`, \`{server}\`, \`{memberCount}\``
    );
  const toggleBtn = new ButtonBuilder()
    .setCustomId('goodbye_toggle')
    .setLabel(cfg.goodbyeEnabled ? 'Disabilita' : 'Abilita')
    .setStyle(cfg.goodbyeEnabled ? 4 : 3);
  const editMsgBtn = new ButtonBuilder()
    .setCustomId('goodbye_edit_message')
    .setLabel('Modifica Messaggio')
    .setStyle(1)
    .setEmoji('✏️');
  const row1 = new ActionRowBuilder().addComponents(toggleBtn, editMsgBtn);
  const rows = [row1];
  if (chOptions.length > 0) {
    const channelMenu = new StringSelectMenuBuilder()
      .setCustomId('goodbye_channel_select')
      .setPlaceholder('Seleziona canale goodbye')
      .addOptions(chOptions);
    rows.push(new ActionRowBuilder().addComponents(channelMenu));
  }
  return { embed, rows };
}
// Handle select menu
async function handleSelect(interaction, channelId) {
  try {
    await interaction.deferUpdate();
    // PATCH: update DB
    await db.updateGuildConfig(interaction.guildId, { goodbyeChannelId: channelId });
    // PATCH: rebuild config subito prima del dashboard
    const freshCfg = await db.getGuildConfig(interaction.guildId);
    if (freshCfg) {
      interaction.client.guildConfigs.set(interaction.guildId, freshCfg);
    }
    const { embed, rows } = buildDashboard(interaction);
    return interaction.editReply({ embeds: [embed], components: rows });
  } catch (error) {
    console.error('[goodbye] Error in handleSelect:', error);
    return interaction.editReply({ content: '❌ Errore durante l\'aggiornamento.', embeds: [], components: [] }).catch(() => {});
  }
}
// Handle buttons
async function handleComponent(interaction) {
  try {
    const id = interaction.customId;
    if (id === 'goodbye_toggle') {
      await interaction.deferUpdate();
      const cfg = ensureConfig(interaction);
      const newVal = !cfg.goodbyeEnabled;
      // PATCH: update DB
      await db.updateGuildConfig(interaction.guildId, { goodbyeEnabled: newVal });
      // PATCH: rebuild config subito prima del dashboard
      const freshCfg = await db.getGuildConfig(interaction.guildId);
      if (freshCfg) {
        interaction.client.guildConfigs.set(interaction.guildId, freshCfg);
      }
      const { embed, rows } = buildDashboard(interaction);
      return interaction.editReply({ embeds: [embed], components: rows });
    }
    if (id === 'goodbye_edit_message') {
      const modal = new ModalBuilder()
        .setCustomId('goodbye_message_modal')
        .setTitle('Modifica Messaggio Goodbye');
      const msgInput = new TextInputBuilder()
        .setCustomId('goodbye_msg_input')
        .setLabel('Messaggio')
        .setStyle(TextInputStyle.Paragraph)
        .setPlaceholder('Es: Addio {user}! Arrivederci.')
        .setValue(ensureConfig(interaction).goodbyeMessage || '')
        .setRequired(true)
        .setMaxLength(500);
      modal.addComponents(new ActionRowBuilder().addComponents(msgInput));
      return interaction.showModal(modal);
    }
  } catch (error) {
    console.error('[goodbye] Error in handleComponent:', error);
    return interaction.reply({ content: '❌ Errore nell\'interazione.', ephemeral: true }).catch(() => {});
  }
}
// Handle modals
async function handleModals(interaction) {
  try {
    const id = interaction.customId;
    if (id === 'goodbye_message_modal') {
      await interaction.deferUpdate();
      const msg = interaction.fields.getTextInputValue('goodbye_msg_input');
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
  // NEW entrypoint required by home.js and dynamic routing
  async execute(interaction) {
    // Backward compatibility: map legacy handlers
    const self = module.exports;
    self.showPanel = self.showPanel || self.handleGoodbye;

    try {
      const { embed, rows } = buildDashboard(interaction);
      if (interaction.replied || interaction.deferred) {
        return interaction.editReply({ embeds: [embed], components: rows });
      }
      return interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
    } catch (error) {
      console.error('[goodbye] Error in execute:', error);
      return interaction.reply({ content: '❌ Errore nel caricamento della dashboard.', ephemeral: true }).catch(() => {});
    }
  },

  // Entrypoint legacy to render dashboard
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
  },
  // Alias for compatibility with setbot.js
  async showPanel(interaction, config) {
    return this.handleGoodbye(interaction);
  }
};
