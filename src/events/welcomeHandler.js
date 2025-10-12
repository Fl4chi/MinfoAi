// src/events/welcomeHandler.js
// Feature: premium welcome embeds, config/channel saving using MongoDB, dynamic variables, dashboard preview
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
function buildWelcomeEmbed(cfg, member) {
  const guild = member.guild;
  const title = formatTemplate(cfg.welcomeTitle || 'Benvenuto {member.name}! 🎉', member, guild);
  const desc = formatTemplate(cfg.welcomeMessage || 'Ciao {member.mention}, benvenuto su {guild}! Ora siamo {guild.count} membri.', member, guild);
  const color = cfg.welcomeColor || 0x2f3136; // dark default
  const thumb = cfg.welcomeThumbnail === 'avatar' ? member.user.displayAvatarURL({ size: 256 }) : (cfg.welcomeThumbnail || null);
  const banner = cfg.welcomeBanner === 'guild' ? guild.iconURL({ size: 1024, extension: 'png' }) : (cfg.welcomeBanner || null);
  const footerText = formatTemplate(cfg.welcomeFooter || guild.name, member, guild);
  
  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(desc)
    .setColor(color)
    .setTimestamp(new Date());
  
  if (thumb) embed.setThumbnail(thumb);
  if (banner) embed.setImage(banner);
  if (footerText) embed.setFooter({ text: footerText, iconURL: guild.iconURL?.() || undefined });
  
  if (cfg.welcomeFields && Array.isArray(cfg.welcomeFields)) {
    const fields = cfg.welcomeFields
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
function resolveWelcomeChannel(guild, channelId) {
  if (!guild || !channelId) return null;
  const byId = guild.channels.cache.get(channelId);
  if (byId?.type === ChannelType.GuildText) return byId;
  return null;
}

// Public API to set config (intended for dashboard/command usage)
async function setWelcomeConfig(guild, cfg) {
  if (!guild?.id) throw new Error('Guild required');
  
  const updates = {
    welcomeEnabled: cfg.enabled !== false,
    welcomeChannelId: cfg.channelId || null,
    welcomeTitle: cfg.title,
    welcomeMessage: cfg.description || cfg.message,
    welcomeColor: typeof cfg.color === 'number' ? cfg.color : 0x2f3136,
    welcomeThumbnail: cfg.thumbnail, // 'avatar' | url | null
    welcomeBanner: cfg.banner, // 'guild' | url | null
    welcomeFooter: cfg.footer,
    welcomeFields: Array.isArray(cfg.fields) ? cfg.fields : [],
  };
  
  await db.updateGuildConfig(guild.id, updates);
  return updates;
}

// Get config
async function getWelcomeConfig(guildId) {
  try {
    const config = await db.getGuildConfig(guildId);
    return config || null;
  } catch (error) {
    console.error(`[welcomeHandler] Error getting welcome config for ${guildId}:`, error);
    return null;
  }
}

// Dashboard Preview: returns an embed built using a mock/dry member
async function previewWelcomeEmbed(client, guildId, sampleMemberId) {
  const guild = client.guilds.cache.get(guildId);
  if (!guild) throw new Error('Guild not found');
  
  const cfg = await getWelcomeConfig(guildId) || {};
  const member = sampleMemberId && guild.members.cache.get(sampleMemberId) || guild.members.me || guild.members.cache.first();
  if (!member) throw new Error('No member available for preview');
  
  return buildWelcomeEmbed(cfg, member);
}

// Event handler: on new member join
async function onGuildMemberAdd(member) {
  try {
    const guild = member.guild;
    const cfg = await getWelcomeConfig(guild.id);
    
    if (!cfg || cfg.welcomeEnabled === false) return;
    
    const channel = resolveWelcomeChannel(guild, cfg.welcomeChannelId);
    if (!channel) return;
    
    // permission check
    const me = guild.members.me;
    const perms = channel.permissionsFor(me);
    if (!perms?.has(PermissionsBitField.Flags.ViewChannel) || 
        !perms?.has(PermissionsBitField.Flags.SendMessages) || 
        !perms?.has(PermissionsBitField.Flags.EmbedLinks)) {
      return;
    }
    
    const embed = buildWelcomeEmbed(cfg, member);
    await channel.send({ embeds: [embed] });
  } catch (err) {
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
