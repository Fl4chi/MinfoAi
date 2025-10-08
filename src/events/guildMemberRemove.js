const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { logError } = require('../errors/errorHandler');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    try {
      const guild = member.guild;
      
      // Get server configuration from database
      const GuildConfig = require('../database/models/GuildConfig');
      const guildConfig = await GuildConfig.findOne({ guildId: guild.id });
      
      if (!guildConfig) {
        console.log('No guild configuration found, skipping goodbye message');
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
      console.error('Error in guildMemberRemove:', error);
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
      console.error('Goodbye channel not found');
      return;
    }
    
    // Server statistics
    const memberCount = guild.memberCount;
    const daysSinceJoin = member.joinedAt ? Math.floor((Date.now() - member.joinedAt) / (1000 * 60 * 60 * 24)) : 0;
    const accountAge = Math.floor((Date.now() - member.user.createdAt) / (1000 * 60 * 60 * 24));
    
    // Create premium embed with MinfoAi style
    const goodbyeEmbed = new EmbedBuilder()
      .setTitle(`👋 Addio ${member.user.username}!`)
      .setDescription(`Grazie **${member.user.username}** per aver fatto parte della community **MinfoAi**!\n\n😢 **Ci mancherai** - le tue contribuzioni sono state preziose\n🔗 **Porte sempre aperte** - potrai sempre tornare quando vorrai\n🎆 **Buona fortuna** per le tue avventure future!`)
      .setColor(config.embedColor)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .setAuthor({ 
        name: 'Sistema Addio MinfoAi', 
        iconURL: guild.iconURL({ dynamic: true }) || 'https://cdn.discordapp.com/embed/avatars/0.png'
      })
      .addFields(
        { 
          name: '👤 Membro Partito', 
          value: `${member.user.tag}\nID: \`${member.id}\``, 
          inline: true 
        },
        { 
          name: '📊 Statistiche', 
          value: `👥 **${memberCount}** membri rimasti\n📅 **${daysSinceJoin}** giorni con noi\n🎂 **${accountAge}** giorni su Discord`, 
          inline: true 
        },
        { 
          name: '📅 Si è Unito', 
          value: member.joinedAt ? `<t:${Math.floor(member.joinedAt / 1000)}:R>` : 'Data sconosciuta', 
          inline: true 
        },
        { 
          name: '🎉 Ricordi Condivisi', 
          value: '📜 Conversazioni interessanti • 🤝 Nuove amicizie • 🚀 Crescita insieme nella community', 
          inline: false 
        }
      )
      .setImage('https://via.placeholder.com/400x100/FF6B6B/FFFFFF?text=Arrivederci+dalla+MinfoAi+Community')
      .setFooter({ 
        text: `Rimangono ${memberCount} membri • MinfoAi Premium Bot`, 
        iconURL: member.user.displayAvatarURL({ dynamic: true }) 
      })
      .setTimestamp();
    
    await goodbyeChannel.send({ embeds: [goodbyeEmbed] });
    
  } catch (error) {
    console.error('Error sending goodbye message:', error);
  }
}

async function logMemberLeave(member, config) {
  try {
    const guild = member.guild;
    const logChannel = guild.channels.cache.get(config.logChannelId);
    
    if (!logChannel) return;
    
    const daysSinceJoin = member.joinedAt ? Math.floor((Date.now() - member.joinedAt) / (1000 * 60 * 60 * 24)) : 0;
    
    const logEmbed = new EmbedBuilder()
      .setTitle('📤 Membro Uscito')
      .setDescription(`${member} ha lasciato il server`)
      .setColor('#FF4444')
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: '👤 Utente', value: `${member.user.tag} (${member.id})`, inline: true },
        { name: '📅 Si era Unito', value: member.joinedAt ? `<t:${Math.floor(member.joinedAt / 1000)}:R>` : 'Data sconosciuta', inline: true },
        { name: '⏱️ Tempo nel Server', value: `${daysSinceJoin} giorni`, inline: true },
        { name: '📊 Membri Rimasti', value: guild.memberCount.toString(), inline: true }
      )
      .setFooter({ text: 'Sistema Log MinfoAi', iconURL: guild.iconURL({ dynamic: true }) })
      .setTimestamp();
    
    await logChannel.send({ embeds: [logEmbed] });
    
  } catch (error) {
    console.error('Error logging member leave:', error);
  }
}
