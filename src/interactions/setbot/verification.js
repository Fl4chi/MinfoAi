const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionsBitField } = require('discord.js');

// Centralized, fully reactive Verification dashboard like welcome/moderation/goodbye
// - Single source of truth in guildConfigs.verification
// - buildDashboard builds entire message (embed + selects + buttons)
// - updateDashboard recomputes everything on any selection/action
// - Live variable handling via modals/selects immediately updates config and preview
// - Defensive checks, no double replies, consistent deferred/replied handling

// Utilities shared with other modules (align to existing pattern across setbot/*)
function initializeGuildConfigs(client) {
  if (!client) throw new Error('Client object is required');
  if (!client.guildConfigs) client.guildConfigs = new Map();
}

function ensureGuildConfig(interaction) {
  if (!interaction || !interaction.client || !interaction.guild) throw new Error('Invalid interaction, client, or guild');
  const client = interaction.client;
  const guildId = interaction.guild.id;
  initializeGuildConfigs(client);
  if (!client.guildConfigs.has(guildId)) {
    const newConfig = {
      verification: {
        enabled: false,
        channelId: null,
        roleId: null,
        logChannelId: null,
        messageId: null,
        buttonLabel: 'Verify',
        buttonStyle: 'Success', // Primary, Secondary, Success, Danger
        title: 'Verification',
        description: 'Press the button to verify and receive the role.',
      },
      welcome: { enabled: false },
      goodbye: { enabled: false },
      moderation: { enabled: false },
      gamification: { enabled: false },
      music: { enabled: false },
      giveaway: { enabled: false },
    };
    client.guildConfigs.set(guildId, newConfig);
  }
  return client.guildConfigs.get(guildId);
}

function hasBotPermsInChannel(channel) {
  try {
    if (!channel || typeof channel.permissionsFor !== 'function' || !channel.guild?.members?.me) return false;
    const perms = channel.permissionsFor(channel.guild.members.me);
    return perms?.has([
      PermissionsBitField.Flags.ViewChannel,
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.EmbedLinks,
      PermissionsBitField.Flags.ReadMessageHistory,
      PermissionsBitField.Flags.AddReactions,
    ]) ?? false;
  } catch {
    return false;
  }
}

// Options builders
function buildModuleSelect(current) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('verification:module')
      .setPlaceholder('Seleziona sezione')
      .addOptions([
        { label: 'Impostazioni', value: 'settings', description: 'Abilita, canali, ruolo, log', default: current === 'settings' },
        { label: 'Contenuti', value: 'content', description: "Titolo, descrizione, bottone", default: current === 'content' },
        { label: 'Anteprima', value: 'preview', description: 'Vedi come appare', default: current === 'preview' },
      ])
  );
}

function buildSettingsRows(cfg, interaction) {
  const guild = interaction.guild;
  const channels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText && hasBotPermsInChannel(c));
  const channelOptions = Array.from(channels.values()).slice(0, 25).map(c => ({ label: `#${c.name}`, value: c.id, default: cfg.channelId === c.id }));

  const roleOptions = guild.roles.cache.filter(r => r.editable && r.id !== guild.roles.everyone.id).map(r => ({ label: r.name, value: r.id, default: cfg.roleId === r.id })).slice(0, 25);

  const logChannelOptions = Array.from(channels.values()).slice(0, 25).map(c => ({ label: `#${c.name}`, value: c.id, default: cfg.logChannelId === c.id }));

  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('verification:enabled')
        .setPlaceholder('Abilita modulo')
        .addOptions([
          { label: 'Abilitato', value: 'on', description: 'Attiva la verifica', default: cfg.enabled === true },
          { label: 'Disabilitato', value: 'off', description: 'Disattiva la verifica', default: cfg.enabled === false },
        ])
    ),
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('verification:channel')
        .setPlaceholder('Seleziona canale di verifica')
        .addOptions(channelOptions.length ? channelOptions : [{ label: 'Nessun canale disponibile', value: 'none' }])
    ),
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('verification:role')
        .setPlaceholder('Seleziona ruolo da assegnare')
        .addOptions(roleOptions.length ? roleOptions : [{ label: 'Nessun ruolo idoneo', value: 'none' }])
    ),
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('verification:logchannel')
        .setPlaceholder('Seleziona canale log (opzionale)')
        .addOptions(logChannelOptions.length ? logChannelOptions : [{ label: 'Nessun canale disponibile', value: 'none' }])
    ),
  ];
}

function buildContentRows(cfg) {
  return [
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('verification:edit_title').setLabel('Titolo').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('verification:edit_description').setLabel('Descrizione').setStyle(ButtonStyle.Primary),
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('verification:edit_button_label').setLabel('Testo Bottone').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('verification:cycle_button_style').setLabel(`Stile: ${cfg.buttonStyle}`).setStyle(ButtonStyle.Secondary),
    ),
  ];
}

function buildPreviewEmbed(cfg, interaction) {
  const embed = new EmbedBuilder()
    .setColor(cfg.enabled ? 0x00ff88 : 0xff5555)
    .setTitle(cfg.title || 'Verification')
    .setDescription(cfg.description || 'Press the button to verify and receive the role.')
    .addFields(
      { name: 'Stato', value: cfg.enabled ? 'Attivo' : 'Disattivo', inline: true },
      { name: 'Canale', value: cfg.channelId ? `<#${cfg.channelId}>` : 'Nessuno', inline: true },
      { name: 'Ruolo', value: cfg.roleId ? `<@&${cfg.roleId}>` : 'Nessuno', inline: true },
      { name: 'Log', value: cfg.logChannelId ? `<#${cfg.logChannelId}>` : 'Nessuno', inline: true },
      { name: 'Bottone', value: `${cfg.buttonLabel} (${cfg.buttonStyle})`, inline: true },
    )
    .setTimestamp();

  const styleMap = { Primary: ButtonStyle.Primary, Secondary: ButtonStyle.Secondary, Success: ButtonStyle.Success, Danger: ButtonStyle.Danger };
  const btn = new ButtonBuilder().setCustomId('verification:dummy_button').setLabel(cfg.buttonLabel || 'Verify').setStyle(styleMap[cfg.buttonStyle] ?? ButtonStyle.Success).setDisabled(true);
  const row = new ActionRowBuilder().addComponents(btn);
  return { embed, row };
}

function buildDashboard(interaction, section = 'settings') {
  const config = ensureGuildConfig(interaction);
  const cfg = config.verification;

  const topSelect = buildModuleSelect(section);

  let rows = [topSelect];
  if (section === 'settings') rows = rows.concat(buildSettingsRows(cfg, interaction));
  if (section === 'content') rows = rows.concat(buildContentRows(cfg));

  const { embed, row } = buildPreviewEmbed(cfg, interaction);
  const components = [...rows, row];

  return { embeds: [embed], components };
}

async function updateDashboard(interaction, section) {
  try {
    const payload = buildDashboard(interaction, section);
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(payload).catch(() => {});
    } else {
      await interaction.reply({ ...payload, ephemeral: true }).catch(() => {});
    }
  } catch (err) {
    console.error('[Verification] updateDashboard error:', err);
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: '❌ Errore durante aggiornamento dashboard.', ephemeral: true }).catch(() => {});
    } else {
      await interaction.reply({ content: '❌ Errore durante aggiornamento dashboard.', ephemeral: true }).catch(() => {});
    }
  }
}

function nextStyle(current) {
  const order = ['Primary', 'Secondary', 'Success', 'Danger'];
  const idx = Math.max(0, order.indexOf(current));
  return order[(idx + 1) % order.length];
}

async function openModal(interaction, id, title, label, value, style = TextInputStyle.Short) {
  const modal = new ModalBuilder().setCustomId(id).setTitle(title);
  const input = new TextInputBuilder().setCustomId('v_input').setLabel(label).setStyle(style).setRequired(true).setValue(value ?? '');
  modal.addComponents(new ActionRowBuilder().addComponents(input));
  await interaction.showModal(modal);
}

async function handleVerification(interaction) {
  const config = ensureGuildConfig(interaction);
  const cfg = config.verification;
  const section = 'settings';
  const payload = buildDashboard(interaction, section);
  if (interaction.deferred || interaction.replied) return interaction.editReply({ ...payload, ephemeral: true });
  return interaction.reply({ ...payload, ephemeral: true });
}

async function handleSelect(interaction, customId, values) {
  const config = ensureGuildConfig(interaction);
  const cfg = config.verification;

  if (customId === 'verification:module') {
    const section = values?.[0] || 'settings';
    return updateDashboard(interaction, section);
  }

  if (customId === 'verification:enabled') {
    const v = values?.[0] === 'on';
    cfg.enabled = v;
    return updateDashboard(interaction, 'settings');
  }

  if (customId === 'verification:channel') {
    const v = values?.[0];
    cfg.channelId = v && v !== 'none' ? v : null;
    return updateDashboard(interaction, 'settings');
  }

  if (customId === 'verification:role') {
    const v = values?.[0];
    cfg.roleId = v && v !== 'none' ? v : null;
    return updateDashboard(interaction, 'settings');
  }

  if (customId === 'verification:logchannel') {
    const v = values?.[0];
    cfg.logChannelId = v && v !== 'none' ? v : null;
    return updateDashboard(interaction, 'settings');
  }
}

async function handleButton(interaction, customId) {
  const config = ensureGuildConfig(interaction);
  const cfg = config.verification;

  if (customId === 'verification:edit_title') {
    return openModal(interaction, 'verification:modal_title', 'Modifica Titolo', 'Titolo', cfg.title ?? '');
  }
  if (customId === 'verification:edit_description') {
    return openModal(interaction, 'verification:modal_description', 'Modifica Descrizione', 'Descrizione', cfg.description ?? '', TextInputStyle.Paragraph);
  }
  if (customId === 'verification:edit_button_label') {
    return openModal(interaction, 'verification:modal_button_label', 'Modifica Testo Bottone', 'Testo', cfg.buttonLabel ?? 'Verify');
  }
  if (customId === 'verification:cycle_button_style') {
    cfg.buttonStyle = nextStyle(cfg.buttonStyle || 'Success');
    return updateDashboard(interaction, 'content');
  }
}

async function handleModal(interaction, customId) {
  const config = ensureGuildConfig(interaction);
  const cfg = config.verification;
  const value = interaction.fields.getTextInputValue('v_input');

  if (customId === 'verification:modal_title') {
    cfg.title = String(value).slice(0, 256);
    return updateDashboard(interaction, 'content');
  }
  if (customId === 'verification:modal_description') {
    cfg.description = String(value).slice(0, 4000);
    return updateDashboard(interaction, 'content');
  }
  if (customId === 'verification:modal_button_label') {
    cfg.buttonLabel = String(value).slice(0, 80);
    return updateDashboard(interaction, 'content');
  }
}

async function execute(interaction) {
  try {
    if (!interaction?.isRepliable?.()) return;

    if (interaction.isChatInputCommand?.() || interaction.customId === 'setbot:verification' || interaction.commandName === 'setbot' && interaction.options?.getSubcommand?.() === 'verification') {
      if (!interaction.deferred && !interaction.replied) await interaction.deferReply({ ephemeral: true }).catch(() => {});
      return handleVerification(interaction);
    }

    if (interaction.isStringSelectMenu?.() && interaction.customId?.startsWith('verification:')) {
      return handleSelect(interaction, interaction.customId, interaction.values);
    }

    if (interaction.isButton?.() && interaction.customId?.startsWith('verification:')) {
      return handleButton(interaction, interaction.customId);
    }

    if (interaction.isModalSubmit?.() && interaction.customId?.startsWith('verification:')) {
      return handleModal(interaction, interaction.customId);
    }
  } catch (error) {
    console.error('Error in verification.execute:', error);
    const msg = '❌ Errore durante la gestione della dashboard di verifica.';
    if (interaction?.deferred || interaction?.replied) {
      await interaction.editReply({ content: msg, ephemeral: true }).catch(() => {});
    } else if (interaction?.isRepliable?.()) {
      await interaction.reply({ content: msg, ephemeral: true }).catch(() => {});
    }
  }
}

module.exports = {
  name: 'setbot_verification',
  description: 'Configura il modulo verifica',
  handleVerification,
  buildDashboard,
  updateDashboard,
  execute,
  initializeGuildConfigs,
  ensureGuildConfig,
};
