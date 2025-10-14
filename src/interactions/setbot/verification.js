const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionsBitField } = require('discord.js');

// Single source of truth kept in client.guildConfigs[guildId].verification
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
        buttonLabel: '✅ Verifica',
        buttonStyle: 'Success', // Primary, Secondary, Success, Danger
        title: '🔐 Verifica',
        description: 'Premi il bottone per verificarti e ricevere il ruolo.',
        image: null,
        footer: null,
      },
      // Other modules keep shape for consistency
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
    ]);
  } catch {
    return false;
  }
}

// UI builders
function buildVerificationEmbed(interaction, cfg) {
  const guild = interaction.guild;
  const channel = cfg.channelId ? guild.channels.cache.get(cfg.channelId) : null;
  const role = cfg.roleId ? guild.roles.cache.get(cfg.roleId) : null;

  const enabledLine = cfg.enabled ? '🟢 Attivo' : '🔴 Disattivo';
  const channelLine = channel ? `#${channel.name}` : '❌ Canale non impostato';
  const roleLine = role ? `@${role.name}` : '❌ Ruolo non impostato';

  const eb = new EmbedBuilder()
    .setColor(cfg.enabled ? 0x57F287 : 0xED4245)
    .setTitle(cfg.title || '🔐 Verifica')
    .setDescription(cfg.description || 'Premi il bottone per verificarti e ricevere il ruolo.')
    .addFields(
      { name: 'Stato', value: enabledLine, inline: true },
      { name: 'Canale', value: channelLine, inline: true },
      { name: 'Ruolo', value: roleLine, inline: true },
    );

  if (cfg.image) eb.setImage(cfg.image);
  if (cfg.footer) eb.setFooter({ text: cfg.footer });

  return eb;
}

function buildChannelSelect(interaction, cfg) {
  const options = interaction.guild.channels.cache
    .filter(c => [ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(c.type))
    .map(c => ({ label: `#${c.name}`, value: c.id }));

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('verification:select_channel')
      .setPlaceholder('📺 Seleziona il canale di verifica')
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(options.slice(0, 25))
  );
}

function buildRoleSelect(interaction, cfg) {
  const options = interaction.guild.roles.cache
    .filter(r => !r.managed && r.editable)
    .map(r => ({ label: r.name, value: r.id }))
    .slice(0, 25);

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('verification:select_role')
      .setPlaceholder('🧩 Seleziona il ruolo da assegnare')
      .setMinValues(1)
      .setMaxValues(1)
      .addOptions(options.length ? options : [{ label: 'Nessun ruolo disponibile', value: 'none', description: 'Crea un ruolo prima', default: true }])
  );
}

function buildControlButtons(cfg) {
  const onOff = new ButtonBuilder()
    .setCustomId('verification:toggle')
    .setLabel(cfg.enabled ? '🔴 Spegni' : '🟢 Accendi')
    .setStyle(cfg.enabled ? ButtonStyle.Danger : ButtonStyle.Success);

  const reset = new ButtonBuilder()
    .setCustomId('verification:reset')
    .setLabel('♻️ Ripristina')
    .setStyle(ButtonStyle.Secondary);

  const messageBtn = new ButtonBuilder()
    .setCustomId('verification:message')
    .setLabel('📝 Messaggio')
    .setStyle(ButtonStyle.Primary);

  const preview = new ButtonBuilder()
    .setCustomId('verification:preview')
    .setLabel('👀 Anteprima')
    .setStyle(ButtonStyle.Secondary);

  return new ActionRowBuilder().addComponents(onOff, reset, messageBtn, preview);
}

async function buildDashboard(interaction) {
  const config = ensureGuildConfig(interaction);
  const cfg = config.verification;

  const embed = buildVerificationEmbed(interaction, cfg);
  const rows = [
    buildChannelSelect(interaction, cfg),
    buildRoleSelect(interaction, cfg),
    buildControlButtons(cfg),
  ];

  return { embeds: [embed], components: rows, ephemeral: true };
}

async function updateDashboard(interaction, where = 'edit') {
  const data = await buildDashboard(interaction);
  if (interaction.deferred || interaction.replied) {
    return interaction.editReply(data).catch(() => {});
  }
  if (where === 'followup') return interaction.followUp(data).catch(() => {});
  return interaction.reply(data).catch(() => {});
}

// Handlers
async function handleVerification(interaction) {
  const data = await buildDashboard(interaction);
  if (interaction.deferred || interaction.replied) {
    return interaction.editReply(data).catch(() => {});
  }
  return interaction.reply(data).catch(() => {});
}

async function handleSelect(interaction, customId, values) {
  const config = ensureGuildConfig(interaction);
  const cfg = config.verification;

  if (customId === 'verification:select_channel') {
    const channelId = values?.[0];
    cfg.channelId = channelId && channelId !== 'none' ? channelId : null;
  }
  if (customId === 'verification:select_role') {
    const roleId = values?.[0];
    cfg.roleId = roleId && roleId !== 'none' ? roleId : null;
  }
  return updateDashboard(interaction, 'edit');
}

async function openMessageModal(interaction, field) {
  const modal = new ModalBuilder()
    .setCustomId(`verification:modal_${field}`)
    .setTitle('📝 Imposta contenuto');

  const text = new TextInputBuilder()
    .setCustomId('v_input')
    .setLabel(field === 'title' ? 'Titolo' : field === 'description' ? 'Messaggio' : field === 'image' ? 'URL Immagine' : 'Footer')
    .setPlaceholder(field === 'image' ? 'https://...' : 'Testo...')
    .setStyle(field === 'description' ? TextInputStyle.Paragraph : TextInputStyle.Short)
    .setRequired(false);

  modal.addComponents(new ActionRowBuilder().addComponents(text));
  await interaction.showModal(modal).catch(() => {});
}

async function handleButton(interaction, customId) {
  const config = ensureGuildConfig(interaction);
  const cfg = config.verification;

  if (customId === 'verification:toggle') {
    cfg.enabled = !cfg.enabled;
    return updateDashboard(interaction, 'edit');
  }
  if (customId === 'verification:reset') {
    Object.assign(cfg, {
      enabled: false,
      channelId: null,
      roleId: null,
      logChannelId: null,
      messageId: null,
      buttonLabel: '✅ Verifica',
      buttonStyle: 'Success',
      title: '🔐 Verifica',
      description: 'Premi il bottone per verificarti e ricevere il ruolo.',
      image: null,
      footer: null,
    });
    return updateDashboard(interaction, 'edit');
  }
  if (customId === 'verification:message') {
    // Open a mini "menu" using ephemeral update with four quick buttons for Title, Message, Image, Footer
    const bar = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('verification:set_title').setLabel('🏷️ Titolo').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('verification:set_description').setLabel('💬 Messaggio').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('verification:set_image').setLabel('🖼️ Immagine').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('verification:set_footer').setLabel('🧾 Footer').setStyle(ButtonStyle.Secondary),
    );

    const previewEmbed = buildVerificationEmbed(interaction, cfg);
    const payload = { embeds: [previewEmbed], components: [buildChannelSelect(interaction, cfg), buildRoleSelect(interaction, cfg), bar, buildControlButtons(cfg)], ephemeral: true };

    if (interaction.deferred || interaction.replied) return interaction.editReply(payload).catch(() => {});
    return interaction.reply(payload).catch(() => {});
  }
  if (customId === 'verification:preview') {
    // Send a temporary preview as ephemeral follow-up
    const channel = cfg.channelId ? interaction.guild.channels.cache.get(cfg.channelId) : null;
    const embed = buildVerificationEmbed(interaction, cfg);

    // If a target channel exists and bot has perms, send a simulated preview there, else just in ephemeral
    if (channel && hasBotPermsInChannel(channel)) {
      await channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId('noop').setLabel(cfg.buttonLabel || '✅ Verifica').setStyle(ButtonStyle.Success).setDisabled(true))] }).catch(() => {});
    }
    return updateDashboard(interaction, 'followup');
  }
  if (customId === 'verification:set_title') return openMessageModal(interaction, 'title');
  if (customId === 'verification:set_description') return openMessageModal(interaction, 'description');
  if (customId === 'verification:set_image') return openMessageModal(interaction, 'image');
  if (customId === 'verification:set_footer') return openMessageModal(interaction, 'footer');
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
  if (customId === 'verification:modal_image') {
    const url = String(value || '').trim();
    cfg.image = url || null;
    return updateDashboard(interaction, 'content');
  }
  if (customId === 'verification:modal_footer') {
    cfg.footer = String(value || '').slice(0, 2048) || null;
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
