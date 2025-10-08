const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { logError } = require('../errors/errorHandler');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    try {
      const guild = member.guild;
      
      // Configurazione predefinita con stile premium MinfoAi
      const config = {
        goodbyeChannelId: process.env.GOODBYE_CHANNEL_ID,
        logChannelId: process.env.LOG_CHANNEL_ID,
        embedColor: '#FF6B6B', // Warm red for goodbye
        enableGoodbye: true,
        enableLog: true
      };
      
      // Invio messaggio di addio
      if (config.enableGoodbye && config.goodbyeChannelId) {
        await sendGoodbyeMessage(member, config);
      }
      
      // Log dell'evento
      if (config.enableLog && config.logChannelId) {
        await logMemberLeave(member, config);
      }
    } catch (error) {
      console.error('Errore in guildMemberRemove:', error);
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
      console.error('Canale di addio non trovato');
      return;
    }
    
    // Statistiche del server
    const memberCount = guild.memberCount;
    const daysSinceJoin = member.joinedAt ? Math.floor((Date.now() - member.joinedAt) / (1000 * 60 * 60 * 24)) : 0;
    const accountAge = Math.floor((Date.now() - member.user.createdAt) / (1000 * 60 * 60 * 24));
    
    // Creazione embed premium con stile MinfoAi
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
          value: member.joinedAt ? `<t:${Math.floor(member.joinedAt / 1000)}:F>` : 'Data sconosciuta', 
          inline: true 
        },
        { 
          name: '🎉 Ricordi Condivisi', 
          value: '📜 Conversazioni interessanti • 🤝 Nuove amicizie • 🚀 Crescita insieme nella community', 
          inline: false 
        }
      )
      .setImage('https://via.placeholder.com/400x100/FF6B6B/FFFFFF?text=Arrivederci+dalla+MinfoAi+Community') // Placeholder per banner addio
      .setFooter({ 
        text: `Rimangono ${memberCount} membri • MinfoAi Premium Bot`, 
        iconURL: member.user.displayAvatarURL({ dynamic: true }) 
      })
      .setTimestamp();
    
    await goodbyeChannel.send({ embeds: [goodbyeEmbed] });
    
  } catch (error) {
    console.error('Errore nell\'invio del messaggio di addio:', error);
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
    console.error('Errore nel log del membro uscito:', error);
  }
}
