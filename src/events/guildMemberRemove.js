const { EmbedBuilder, PermissionsBitField } = require('discord.js');

// Fallback function to replace errorHandler import
const logError = async () => {};

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    try {
      const guild = member.guild;
      
      // Get server configuration from database
      const GuildConfig = require('../database/models/GuildConfig');
      const guildConfig = await GuildConfig.findOne({ guildId: guild.id });
      
      if (!guildConfig) {
        return;
      }
      
      // Configuration from dashboard (/setbot)
      const config = {
        goodbyeChannelId: guildConfig.goodbye?.channelId,
        logChannelId: guildConfig.logging?.channelId,
        embedColor: guildConfig.goodbye?.embedColor || '#FF6B6B', // Warm red for goodbye
        enableGoodbye: guildConfig.goodbye?.enabled || false,
        enableLog: guildConfig.logging?.enabled || false,
        customMessage: guildConfig.goodbye?.customMessage
      };
      
      // Send goodbye message
      if (config.enableGoodbye && config.goodbyeChannelId) {
        await sendGoodbyeMessage(member, config);
      }
      
      // Log event
      if (config.enableLog && config.logChannelId) {
        await logMemberLeave(member, config);
      }
    } catch (error) {
      await logError(error, {
        event: 'guildMemberRemove',
        memberId: member.id,
        guildId: member.guild.id
      });
    }
  }
};

async function sendGoodbyeMessage(member, config) {
  try {
    const guild = member.guild;
    const goodbyeChannel = guild.channels.cache.get(config.goodbyeChannelId);
    
    if (!goodbyeChannel) {
      return;
    }
    
    // Server statistics
    const memberCount = guild.memberCount;
    const onlineMembers = guild.members.cache.filter(m => m.presence?.status !== 'offline').size;
    
    // Create goodbye embed
    const goodbyeEmbed = new EmbedBuilder()
      .setTitle(`👋 Arrivederci ${member.user.username}!`)
      .setDescription(config.customMessage || `${member.user.username} ha lasciato **${guild.name}**\n\nSperiamo di rivederti presto! 🎉`)
      .setColor(config.embedColor)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { 
          name: '👤 Membro', 
          value: `${member.user.tag}\nID: \`${member.id}\``, 
          inline: true 
        },
        { 
          name: '📊 Statistiche Server', 
          value: `👥 **${memberCount}** membri rimasti\n🟢 **${onlineMembers}** online`, 
          inline: true 
        },
        { 
          name: '📅 Membro da', 
          value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'N/A', 
          inline: true 
        }
      )
      .setFooter({ 
        text: `Ora siamo ${memberCount} membri • MinfoAi Premium Bot`, 
        iconURL: guild.iconURL({ dynamic: true }) 
      })
      .setTimestamp();
    
    await goodbyeChannel.send({ embeds: [goodbyeEmbed] });
    
  } catch (error) {
    // Silent fail
  }
}

async function logMemberLeave(member, config) {
  try {
    const guild = member.guild;
    const logChannel = guild.channels.cache.get(config.logChannelId);
    
    if (!logChannel) return;
    
    const logEmbed = new EmbedBuilder()
      .setTitle('📤 Membro Uscito')
      .setDescription(`${member.user.tag} ha lasciato il server`)
      .setColor('#FF0000')
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '👤 Utente', value: `${member.user.tag} (${member.id})`, inline: true },
        { name: '📅 Membro da', value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>` : 'N/A', inline: true },
        { name: '📊 Membri Rimasti', value: guild.memberCount.toString(), inline: true }
      )
      .setFooter({ text: 'Sistema Log MinfoAi', iconURL: guild.iconURL({ dynamic: true }) })
      .setTimestamp();
    
    await logChannel.send({ embeds: [logEmbed] });
    
  } catch (error) {
    // Silent fail
  }
}
