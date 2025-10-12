// src/events/goodbyeHandler.js
// Feature: premium goodbye embeds, config/channel saving using MongoDB, dynamic variables
const { EmbedBuilder, ChannelType, PermissionsBitField } = require('discord.js');
const db = require('../database/db');

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
function buildGoodbyeEmbed(cfg, member) {
  const guild = member.guild;
  const title = formatTemplate(cfg.goodbyeTitle || '👋 Addio {member.name}!', member, guild);
  const desc = formatTemplate(cfg.goodbyeMessage || 'Grazie per aver fatto parte della nostra community!', member, guild);
  const color = cfg.goodbyeColor || 0xff6b6b; // red default
  const thumb = cfg.goodbyeThumbnail === 'avatar' ? member.user.displayAvatarURL({ size: 256 }) : (cfg.goodbyeThumbnail || null);
  const banner = cfg.goodbyeBanner === 'guild' ? guild.iconURL({ size: 1024, extension: 'png' }) : (cfg.goodbyeBanner || null);
  const footerText = formatTemplate(cfg.goodbyeFooter || 'Ci mancherai! 💔', member, guild);
  
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(desc)
    .setColor(color)
    .setTimestamp(new Date());
  
  if (thumb) embed.setThumbnail(thumb);
  if (banner) embed.setImage(banner);
  if (footerText) embed.setFooter({ text: footerText, iconURL: guild.iconURL?.() || undefined });
  
  if (cfg.goodbyeFields && Array.isArray(cfg.goodbyeFields)) {
    const fields = cfg.goodbyeFields
      .filter(f => f && f.name)
      .slice(0, 10)
      .map(f => ({ 
        name: formatTemplate(f.name, member, guild), 
        value: formatTemplate(f.value || '\u200B', member, guild), 
        inline: !!f.inline 
      }));
    if (fields.length) embed.addFields(fields);
  }
  
  return embed;
}

// Resolve target channel by id/name stored in config
function resolveGoodbyeChannel(guild, channelId) {
  if (!guild || !channelId) return null;
  const byId = guild.channels.cache.get(channelId);
  if (byId?.type === ChannelType.GuildText) return byId;
  return null;
}

// Public API to set config (intended for dashboard/command usage)
async function setGoodbyeConfig(guild, cfg) {
  if (!guild?.id) throw new Error('Guild required');
  
  const updates = {
    goodbyeEnabled: cfg.enabled !== false,
    goodbyeChannelId: cfg.channelId || null,
    goodbyeTitle: cfg.title,
    goodbyeMessage: cfg.description || cfg.message,
    goodbyeColor: typeof cfg.color === 'number' ? cfg.color : 0xff6b6b,
    goodbyeThumbnail: cfg.thumbnail, // 'avatar' | url | null
    goodbyeBanner: cfg.banner, // 'guild' | url | null
    goodbyeFooter: cfg.footer,
    goodbyeFields: Array.isArray(cfg.fields) ? cfg.fields : [],
  };
  
  await db.updateGuildConfig(guild.id, updates);
  return updates;
}

// Get config
async function getGoodbyeConfig(guildId) {
  try {
    const config = await db.getGuildConfig(guildId);
    return config || null;
  } catch (error) {
    console.error(`[goodbyeHandler] Error getting goodbye config for ${guildId}:`, error);
    return null;
  }
}

// Dashboard Preview: returns an embed built using a mock/dry member
async function previewGoodbyeEmbed(client, guildId, sampleMemberId) {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) throw new Error('Guild not found');
  
  const cfg = await getGoodbyeConfig(guildId) || {};
  const member = sampleMemberId && guild.members.cache.get(sampleMemberId) || guild.members.me || guild.members.cache.first();
  if (!member) throw new Error('No member available for preview');
  
  return buildGoodbyeEmbed(cfg, member);
}

// Event handler: on member remove
async function onGuildMemberRemove(member) {
  try {
    const guild = member.guild;
    const cfg = await getGoodbyeConfig(guild.id);
    
    if (!cfg || cfg.goodbyeEnabled === false) return;
    
    const channel = resolveGoodbyeChannel(guild, cfg.goodbyeChannelId);
    if (!channel) return;
    
    // permission check
    const me = guild.members.me;
    const perms = channel.permissionsFor(me);
    if (!perms?.has(PermissionsBitField.Flags.ViewChannel) || 
        !perms?.has(PermissionsBitField.Flags.SendMessages) || 
        !perms?.has(PermissionsBitField.Flags.EmbedLinks)) {
      return;
    }
    
    const embed = buildGoodbyeEmbed(cfg, member);
    await channel.send({ embeds: [embed] });
  } catch (err) {
    console.error('[goodbyeHandler] Error handling guildMemberRemove:', err);
  }
}

module.exports = {
  name: 'goodbyeHandler',
  onGuildMemberRemove,
  setGoodbyeConfig,
  getGoodbyeConfig,
  previewGoodbyeEmbed,
  buildGoodbyeEmbed,
  formatTemplate,
};
