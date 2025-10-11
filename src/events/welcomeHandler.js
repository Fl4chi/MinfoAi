// src/events/welcomeHandler.js
// Feature: premium welcome embeds, config/channel saving, dynamic variables, dashboard preview

const { EmbedBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const path = require('path');

// Simple in-memory cache; if project has a db/util, replace with it.
const guildWelcomeConfig = new Map();

// Utility: format with dynamic variables
function formatTemplate(template, member, guild) {
  const replacements = {
    '{member}': `${member}`,
    '{member.name}': member.user?.username || member.displayName || member.id,
    '{member.mention}': `<@${member.id}>`,
    '{member.id}': member.id,
    '{guild}': guild?.name || 'this server',
    '{guild.id}': guild?.id || '',
    '{guild.count}': guild?.memberCount?.toString() || '',
    '{createdAt}': member.user?.createdAt?.toLocaleDateString?.() || '',
    '{joinedAt}': member.joinedAt?.toLocaleDateString?.() || ''
  };
  return Object.entries(replacements).reduce((acc, [key, val]) => acc.split(key).join(val), template);
}

// Build premium-looking embed
function buildWelcomeEmbed(cfg, member) {
  const guild = member.guild;
  const title = formatTemplate(cfg.title || 'Benvenuto {member.name}! 🎉', member, guild);
  const desc = formatTemplate(cfg.description || 'Ciao {member.mention}, benvenuto su {guild}! Ora siamo {guild.count} membri.', member, guild);
  const color = cfg.color || 0x2f3136; // dark default
  const thumb = cfg.thumbnail === 'avatar' ? member.user.displayAvatarURL({ size: 256 }) : (cfg.thumbnail || null);
  const banner = cfg.banner === 'guild' ? guild.iconURL({ size: 1024, extension: 'png' }) : (cfg.banner || null);
  const footerText = formatTemplate(cfg.footer || guild.name, member, guild);

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(desc)
    .setColor(color)
    .setTimestamp(new Date());

  if (thumb) embed.setThumbnail(thumb);
  if (banner) embed.setImage(banner);
  if (footerText) embed.setFooter({ text: footerText, iconURL: guild.iconURL?.() || undefined });

  if (cfg.fields && Array.isArray(cfg.fields)) {
    const fields = cfg.fields
      .filter(f => f && f.name)
      .slice(0, 10)
      .map(f => ({ name: formatTemplate(f.name, member, guild), value: formatTemplate(f.value || '\u200B', member, guild), inline: !!f.inline }));
    if (fields.length) embed.addFields(fields);
  }

  return embed;
}

// Resolve target channel by id/name stored in config
function resolveWelcomeChannel(guild, channelId) {
  if (!guild || !channelId) return null;
  const byId = guild.channels.cache.get(channelId);
  if (byId?.type === ChannelType.GuildText) return byId;
  return null;
}

// Public API to set config (intended for dashboard usage)
async function setWelcomeConfig(guild, cfg) {
  if (!guild?.id) throw new Error('Guild required');
  const normalized = {
    enabled: cfg.enabled !== false,
    channelId: cfg.channelId || null,
    title: cfg.title,
    description: cfg.description,
    color: typeof cfg.color === 'number' ? cfg.color : 0x2f3136,
    thumbnail: cfg.thumbnail, // 'avatar' | url | null
    banner: cfg.banner, // 'guild' | url | null
    footer: cfg.footer,
    fields: Array.isArray(cfg.fields) ? cfg.fields : [],
  };
  guildWelcomeConfig.set(guild.id, normalized);
  return normalized;
}

// Get config
function getWelcomeConfig(guildId) {
  return guildWelcomeConfig.get(guildId) || null;
}

// Dashboard Preview: returns an embed built using a mock/dry member
async function previewWelcomeEmbed(client, guildId, sampleMemberId) {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) throw new Error('Guild not found');
  const cfg = getWelcomeConfig(guildId) || {};
  const member = sampleMemberId && guild.members.cache.get(sampleMemberId) || guild.members.me || guild.members.cache.first();
  if (!member) throw new Error('No member available for preview');
  return buildWelcomeEmbed(cfg, member);
}

// Event handler: on new member join
async function onGuildMemberAdd(member) {
  try {
    const guild = member.guild;
    const cfg = getWelcomeConfig(guild.id);
    if (!cfg || cfg.enabled === false) return;

    const channel = resolveWelcomeChannel(guild, cfg.channelId);
    if (!channel) return;

    // permission check
    const me = guild.members.me;
    const perms = channel.permissionsFor(me);
    if (!perms?.has(PermissionsBitField.Flags.ViewChannel) || !perms?.has(PermissionsBitField.Flags.SendMessages) || !perms?.has(PermissionsBitField.Flags.EmbedLinks)) {
      return;
    }

    const embed = buildWelcomeEmbed(cfg, member);
    await channel.send({ embeds: [embed] });
  } catch (err) {
    // log in your preferred logger
    console.error('[welcomeHandler] Error handling guildMemberAdd:', err);
  }
}

module.exports = {
  name: 'welcomeHandler',
  onGuildMemberAdd,
  setWelcomeConfig,
  getWelcomeConfig,
  previewWelcomeEmbed,
  buildWelcomeEmbed,
  formatTemplate,
};
