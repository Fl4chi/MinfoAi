// Refactored: 2025-10-12 - Dashboard goodbye con aggiornamento live immediato
// Pattern: onComponent, onModal, buildDashboard (ref: verification.js)

const db = require('../../database/db');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType } = require('discord.js');

// Helper: get channels
function getTextChannels(interaction) {
  return interaction.guild.channels.cache
    .filter(c => c.type === ChannelType.GuildText)
    .map(c => ({ label: `#${c.name}`, value: c.id }))
    .slice(0, 24);
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
    )
  ];

  return { embed, rows };
}

// Handle select menu changes
async function handleSelect(interaction, value) {
  await interaction.deferUpdate();
  const cfg = ensureConfig(interaction);
  const newVal = value === 'none' ? null : value;
  cfg.goodbyeChannelId = newVal;
  await db.updateGuildConfig(interaction.guildId, { goodbyeChannelId: newVal });
  interaction.client.guildConfigs.set(interaction.guildId, cfg);
  const { embed, rows } = buildDashboard(interaction);
  return interaction.editReply({ embeds: [embed], components: rows });
}

// Handle button clicks
async function handleComponent(interaction) {
  const id = interaction.customId;
  
  if (id === 'goodbye_toggle') {
    await interaction.deferUpdate();
    const cfg = ensureConfig(interaction);
    cfg.goodbyeEnabled = !cfg.goodbyeEnabled;
    await db.updateGuildConfig(interaction.guildId, { goodbyeEnabled: cfg.goodbyeEnabled });
    interaction.client.guildConfigs.set(interaction.guildId, cfg);
    const { embed, rows } = buildDashboard(interaction);
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
}

// Handle modal submits
async function handleModals(interaction) {
  if (interaction.customId === 'goodbye_message_modal') {
    await interaction.deferUpdate();
    const msg = interaction.fields.getTextInputValue('goodbye_message_input');
    const cfg = ensureConfig(interaction);
    cfg.goodbyeMessage = msg;
    await db.updateGuildConfig(interaction.guildId, { goodbyeMessage: msg });
    interaction.client.guildConfigs.set(interaction.guildId, cfg);
    const { embed, rows } = buildDashboard(interaction);
    return interaction.editReply({ embeds: [embed], components: rows });
  }
}

module.exports = {
  // Entrypoint to render dashboard
  async handleGoodbye(interaction) {
    const { embed, rows } = buildDashboard(interaction);
    if (interaction.replied || interaction.deferred) {
      return interaction.editReply({ embeds: [embed], components: rows });
    }
    return interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
  },

  // Router for selects/buttons
  async onComponent(interaction) {
    const id = interaction.customId;
    if (id === 'goodbye_channel_select') {
      const v = interaction.values?.[0];
      return handleSelect(interaction, v);
    }
    return handleComponent(interaction);
  },

  // Router for modals
  async onModal(interaction) {
    return handleModals(interaction);
  }
};
