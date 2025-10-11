// src/events/giveawayHandler.js
// Handles creation/management of giveaways, config for ping channel/role, preview and requirements

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType } = require('discord.js');

// In-memory store; replace with DB as needed
const store = {
  config: {
    pingChannelId: null,
    pingRoleId: null,
    requirements: {
      minAccountAgeDays: 0,
      mustBeInGuild: null, // guildId or null
      requiredRoles: [],
    },
  },
  giveaways: new Map(), // messageId -> { prize, winners, endsAt, channelId, hostId }
};

function humanizeDuration(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [
    d ? `${d}d` : null,
    h ? `${h}h` : null,
    m ? `${m}m` : null,
    sec ? `${sec}s` : null,
  ].filter(Boolean).join(' ');
}

function checkRequirements(member, user, joinedTimestamp, opts = store.config.requirements) {
  // Account age
  if (opts.minAccountAgeDays) {
    const minMs = opts.minAccountAgeDays * 24 * 60 * 60 * 1000;
    if (Date.now() - user.createdAt.getTime() < minMs) return { ok: false, reason: `Account must be at least ${opts.minAccountAgeDays}d old.` };
  }
  // Guild membership
  if (opts.mustBeInGuild && member.guild.id !== opts.mustBeInGuild) {
    return { ok: false, reason: `You must be in the required server.` };
  }
  // Required roles
  if (opts.requiredRoles?.length) {
    const hasAll = opts.requiredRoles.every(r => member.roles.cache.has(r));
    if (!hasAll) return { ok: false, reason: `Missing required role(s).` };
  }
  // Optional joined duration requirement
  if (joinedTimestamp && joinedTimestamp > Date.now()) {
    return { ok: false, reason: `Invalid join date.` };
  }
  return { ok: true };
}

async function sendPreview(channel, data) {
  const embed = new EmbedBuilder()
    .setTitle('Giveaway Preview')
    .setDescription(`Prize: ${data.prize}\nWinners: ${data.winners}\nDuration: ${humanizeDuration(data.durationMs)}\nHost: <@${data.hostId}>`)
    .setColor(0x00AE86)
    .setTimestamp(new Date(Date.now() + data.durationMs))
    .setFooter({ text: 'Ends' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('gw_enter_preview').setStyle(ButtonStyle.Secondary).setLabel('Enter (preview)').setDisabled(true)
  );
  return channel.send({ embeds: [embed], components: [row] });
}

async function createGiveaway(client, options) {
  const { channelId, prize, winners = 1, durationMs = 60_000, hostId } = options;
  const channel = await client.channels.fetch(channelId).catch(() => null);
  if (!channel || channel.type !== ChannelType.GuildText) throw new Error('Invalid channel for giveaway');

  const embed = new EmbedBuilder()
    .setTitle('🎉 Giveaway')
    .setDescription(`Prize: ${prize}\nWinners: ${winners}\nReact with 🎉 to enter!`)
    .setColor(0xFEE75C)
    .setTimestamp(new Date(Date.now() + durationMs))
    .setFooter({ text: 'Ends' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('gw_enter').setStyle(ButtonStyle.Primary).setLabel('Enter 🎉')
  );

  const msg = await channel.send({ content: store.config.pingRoleId ? `<@&${store.config.pingRoleId}>` : undefined, embeds: [embed], components: [row] });
  const endsAt = Date.now() + durationMs;

  store.giveaways.set(msg.id, { prize, winners, endsAt, channelId, hostId, entrants: new Set() });
  return msg;
}

function pickWinners(entrants, count) {
  const pool = Array.from(entrants);
  if (pool.length === 0) return [];
  const result = new Set();
  while (result.size < Math.min(count, pool.length)) {
    result.add(pool[Math.floor(Math.random() * pool.length)]);
  }
  return Array.from(result);
}

async function closeGiveaway(client, messageId) {
  const data = store.giveaways.get(messageId);
  if (!data) throw new Error('Giveaway not found');
  const channel = await client.channels.fetch(data.channelId).catch(() => null);
  if (!channel) throw new Error('Channel not found');
  const msg = await channel.messages.fetch(messageId).catch(() => null);
  const winners = pickWinners(data.entrants || [], data.winners);
  const embed = new EmbedBuilder()
    .setTitle('🎉 Giveaway Ended')
    .setDescription(`Prize: ${data.prize}\nWinners: ${winners.length ? winners.map(id => `<@${id}>`).join(', ') : 'No valid entries'}`)
    .setColor(0xED4245)
    .setTimestamp(new Date())
    .setFooter({ text: 'Ended' });
  await channel.send({ content: winners.length ? winners.map(id => `<@${id}>`).join(' ') : undefined, embeds: [embed] });
  store.giveaways.delete(messageId);
}

function registerInteractions(client) {
  client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    if (interaction.customId !== 'gw_enter') return;

    const data = store.giveaways.get(interaction.message.id);
    if (!data) return interaction.reply({ content: 'Giveaway not found or ended.', ephemeral: true });

    const member = await interaction.guild.members.fetch(interaction.user.id).catch(() => null);
    if (!member) return interaction.reply({ content: 'You must be in the server.', ephemeral: true });

    const req = checkRequirements(member, interaction.user, member.joinedTimestamp);
    if (!req.ok) return interaction.reply({ content: req.reason, ephemeral: true });

    data.entrants ||= new Set();
    data.entrants.add(interaction.user.id);
    await interaction.reply({ content: 'You are entered! 🎉', ephemeral: true });
  });
}

function scheduleWatcher(client) {
  setInterval(async () => {
    for (const [id, data] of Array.from(store.giveaways.entries())) {
      if (Date.now() >= data.endsAt) {
        try { await closeGiveaway(client, id); } catch { /* noop */ }
      }
    }
  }, 5_000);
}

// Admin commands (to be wired in your command handler)
const GiveawayHandler = {
  name: 'giveawayHandler',
  store,

  // Configure ping channel for giveaways
  async setPingChannel(message, channel) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply('Missing permission: Manage Server');
    if (!channel || channel.type !== ChannelType.GuildText) return message.reply('Provide a valid text channel.');
    store.config.pingChannelId = channel.id;
    return message.reply(`Ping channel set to ${channel}.`);
  },

  // Configure ping role for giveaways
  async setPingRole(message, role) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageRoles)) return message.reply('Missing permission: Manage Roles');
    if (!role) return message.reply('Provide a valid role.');
    store.config.pingRoleId = role.id;
    return message.reply(`Ping role set to ${role}.`);
  },

  // Configure entry requirements
  async setRequirements(message, { minAccountAgeDays = 0, mustBeInGuild = null, requiredRoles = [] } = {}) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply('Missing permission: Manage Server');
    store.config.requirements = { minAccountAgeDays, mustBeInGuild, requiredRoles };
    return message.reply(`Requirements updated. Min age: ${minAccountAgeDays}d, Roles: ${requiredRoles.length}.`);
  },

  // Preview embed for giveaway settings
  async preview(message, { prize = 'Sample Prize', winners = 1, durationMs = 60_000 } = {}) {
    const channel = store.config.pingChannelId ? message.guild.channels.cache.get(store.config.pingChannelId) : message.channel;
    if (!channel) return message.reply('Configured channel not found.');
    await sendPreview(channel, { prize, winners, durationMs, hostId: message.author.id });
    return message.reply('Preview sent.');
  },

  // Create a giveaway
  async create(message, { channel = null, prize, winners = 1, durationMs = 60_000 } = {}) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply('Missing permission: Manage Server');
    if (!prize) return message.reply('Provide a prize.');
    const target = channel || (store.config.pingChannelId && message.guild.channels.cache.get(store.config.pingChannelId)) || message.channel;
    const msg = await createGiveaway(message.client, { channelId: target.id, prize, winners, durationMs, hostId: message.author.id });
    return message.reply(`Giveaway created in ${target} (message ${msg.id}).`);
  },

  // Force close a giveaway
  async end(message, messageId) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) return message.reply('Missing permission: Manage Server');
    try { await closeGiveaway(message.client, messageId); return message.reply('Giveaway ended.'); } catch (e) { return message.reply(String(e.message || e)); }
  },

  // Wire up listeners and scheduler once on bot ready
  init(client) {
    registerInteractions(client);
    scheduleWatcher(client);
  },
};

module.exports = GiveawayHandler;
