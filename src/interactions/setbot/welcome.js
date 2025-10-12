// Refactored: 2025-10-12 - Dashboard welcome con aggiornamento live immediato
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
    )
  ];

  return { embed, rows };
}

// Handle select menu changes
async function handleSelect(interaction, value) {
  await interaction.deferUpdate();
  const cfg = ensureConfig(interaction);
  const newVal = value === 'none' ? null : value;
  cfg.welcomeChannelId = newVal;
  await db.updateGuildConfig(interaction.guildId, { welcomeChannelId: newVal });
  interaction.client.guildConfigs.set(interaction.guildId, cfg);
  const { embed, rows } = buildDashboard(interaction);
  return interaction.editReply({ embeds: [embed], components: rows });
}

// Handle button clicks
async function handleComponent(interaction) {
  const id = interaction.customId;
  
  if (id === 'welcome_toggle') {
    await interaction.deferUpdate();
    const cfg = ensureConfig(interaction);
    cfg.welcomeEnabled = !cfg.welcomeEnabled;
    await db.updateGuildConfig(interaction.guildId, { welcomeEnabled: cfg.welcomeEnabled });
    interaction.client.guildConfigs.set(interaction.guildId, cfg);
    const { embed, rows } = buildDashboard(interaction);
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
}

// Handle modal submits
async function handleModals(interaction) {
  if (interaction.customId === 'welcome_message_modal') {
    await interaction.deferUpdate();
    const msg = interaction.fields.getTextInputValue('welcome_message_input');
    const cfg = ensureConfig(interaction);
    cfg.welcomeMessage = msg;
    await db.updateGuildConfig(interaction.guildId, { welcomeMessage: msg });
    interaction.client.guildConfigs.set(interaction.guildId, cfg);
    const { embed, rows } = buildDashboard(interaction);
    return interaction.editReply({ embeds: [embed], components: rows });
  }
}

module.exports = {
  // Entrypoint to render dashboard
  async handleWelcome(interaction) {
    const { embed, rows } = buildDashboard(interaction);
    if (interaction.replied || interaction.deferred) {
      return interaction.editReply({ embeds: [embed], components: rows });
    }
    return interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
  },

  // Router for selects/buttons
  async onComponent(interaction) {
    const id = interaction.customId;
    if (id === 'welcome_channel_select') {
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
