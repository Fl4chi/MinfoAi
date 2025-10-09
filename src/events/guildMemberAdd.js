const { EmbedBuilder, PermissionsBitField } = require('discord.js');

// Fallback function to replace errorHandler import
const logError = async () => {};

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    try {
      const guild = member.guild;
      
      // Get server configuration from database (assuming you have a GuildConfig model)
      const GuildConfig = require('../database/models/GuildConfig');
      const guildConfig = await GuildConfig.findOne({ guildId: guild.id });
      
      if (!guildConfig) {
        return;
      }
      
      // Configuration from dashboard (/setbot)
      const config = {
        welcomeChannelId: guildConfig.welcome?.channelId,
        logChannelId: guildConfig.logging?.channelId,
        embedColor: guildConfig.welcome?.embedColor || '#8A2BE2', // Purple premium color
        enableWelcome: guildConfig.welcome?.enabled || false,
        enableLog: guildConfig.logging?.enabled || false,
        customMessage: guildConfig.welcome?.customMessage
      };
      
      // Send welcome message
      if (config.enableWelcome && config.welcomeChannelId) {
        await sendWelcomeMessage(member, config);
      }
      
      // Log event
      if (config.enableLog && config.logChannelId) {
        await logMemberJoin(member, config);
      }
    } catch (error) {
      await logError(error, {
        event: 'guildMemberAdd',
        memberId: member.id,
        guildId: member.guild.id
      });
    }
  }
};

async function sendWelcomeMessage(member, config) {
  try {
    const guild = member.guild;
    const welcomeChannel = guild.channels.cache.get(config.welcomeChannelId);
    
    if (!welcomeChannel) {
      return;
    }
    
    // Check bot permissions
    if (!welcomeChannel.permissionsFor(guild.members.me).has([PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.EmbedLinks])) {
      return;
    }
    
    // Get member stats
    const memberCount = guild.memberCount;
    const onlineMembers = guild.members.cache.filter(m => m.presence?.status !== 'offline').size;
    const boostCount = guild.premiumSubscriptionCount || 0;
    
    // Create welcome embed
    const welcomeEmbed = new EmbedBuilder()
      .setTitle(`🎉 Benvenuto/a ${member.user.username}!`)
      .setDescription(config.customMessage || `Benvenuto/a su **${guild.name}**!\n\nSiamo felici di averti qui con noi! 🚀`)
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
          value: `👥 **${memberCount}** membri totali\n🟢 **${onlineMembers}** online\n🚀 **${boostCount}** boost`, 
          inline: true 
        },
        { 
          name: '📅 Account Creato', 
          value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, 
          inline: true 
        },
        { 
          name: '🔗 Link Utili', 
          value: '📜 <#RULES_CHANNEL_ID> • 💬 <#GENERAL_CHANNEL_ID> • ❓ <#HELP_CHANNEL_ID>', 
          inline: false 
        }
      )
      .setImage('https://via.placeholder.com/400x100/8A2BE2/FFFFFF?text=MinfoAi+Community') // Placeholder for banner
      .setFooter({ 
        text: `Sei il membro #${memberCount} • MinfoAi Premium Bot`, 
        iconURL: member.user.displayAvatarURL({ dynamic: true }) 
      })
      .setTimestamp();
    
    await welcomeChannel.send({ embeds: [welcomeEmbed] });
    
  } catch (error) {
    // Silent fail
  }
}

async function logMemberJoin(member, config) {
  try {
    const guild = member.guild;
    const logChannel = guild.channels.cache.get(config.logChannelId);
    
    if (!logChannel) return;
    
    const logEmbed = new EmbedBuilder()
      .setTitle('📥 Nuovo Membro')
      .setDescription(`${member} si è unito al server`)
      .setColor('#00FF00')
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '👤 Utente', value: `${member.user.tag} (${member.id})`, inline: true },
        { name: '📅 Account Creato', value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`, inline: true },
        { name: '📊 Membri Totali', value: guild.memberCount.toString(), inline: true }
      )
      .setFooter({ text: 'Sistema Log MinfoAi', iconURL: guild.iconURL({ dynamic: true }) })
      .setTimestamp();
    
    await logChannel.send({ embeds: [logEmbed] });
    
  } catch (error) {
    // Silent fail
  }
}
