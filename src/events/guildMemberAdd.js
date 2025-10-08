const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { logError } = require('../errors/errorHandler');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member) {
    try {
      const guild = member.guild;
      
      // Configurazione predefinita (può essere personalizzata tramite database)
      const config = {
        welcomeChannelId: process.env.WELCOME_CHANNEL_ID,
        logChannelId: process.env.LOG_CHANNEL_ID,
        welcomeMessage: process.env.WELCOME_MESSAGE || 'Benvenuto/a {user} nel server **{guild}**! 🎉\n\nSperiamo che tu possa divertirti e rispettare le regole del server.',
        embedColor: '#00FF00',
        enableWelcome: true,
        enableLog: true
      };

      // Invio messaggio di benvenuto
      if (config.enableWelcome && config.welcomeChannelId) {
        await sendWelcomeMessage(member, config);
      }

      // Log dell'evento
      if (config.enableLog && config.logChannelId) {
        await logMemberJoin(member, config);
      }

    } catch (error) {
      console.error('Errore in guildMemberAdd:', error);
      await logError(error, {
        event: 'guildMemberAdd',
        memberId: member.id,
        guildId: member.guild.id
      });
    }
  }
};

/**
 * Invia il messaggio di benvenuto personalizzato
 */
async function sendWelcomeMessage(member, config) {
  try {
    const welcomeChannel = member.guild.channels.cache.get(config.welcomeChannelId);
    
    if (!welcomeChannel) {
      console.warn(`Canale di benvenuto non trovato: ${config.welcomeChannelId}`);
      return;
    }

    // Verifica permessi del bot
    const botMember = member.guild.members.me;
    if (!welcomeChannel.permissionsFor(botMember).has([
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.EmbedLinks
    ])) {
      console.warn(`Permessi insufficienti nel canale di benvenuto: ${welcomeChannel.name}`);
      return;
    }

    // Personalizzazione del messaggio
    const personalizedMessage = config.welcomeMessage
      .replace(/{user}/g, `<@${member.id}>`)
      .replace(/{guild}/g, member.guild.name)
      .replace(/{memberCount}/g, member.guild.memberCount)
      .replace(/{username}/g, member.user.username);

    // Creazione embed di benvenuto
    const welcomeEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('🎉 Nuovo Membro!')
      .setDescription(personalizedMessage)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields([
        {
          name: '👤 Utente',
          value: `${member.user.tag}\n<@${member.id}>`,
          inline: true
        },
        {
          name: '📅 Account Creato',
          value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:R>`,
          inline: true
        },
        {
          name: '📊 Membri Totali',
          value: `${member.guild.memberCount}`,
          inline: true
        }
      ])
      .setFooter({
        text: `ID: ${member.id} • ${member.guild.name}`,
        iconURL: member.guild.iconURL({ dynamic: true })
      })
      .setTimestamp();

    await welcomeChannel.send({
      embeds: [welcomeEmbed]
    });

    console.log(`✅ Messaggio di benvenuto inviato per ${member.user.tag} in ${welcomeChannel.name}`);

  } catch (error) {
    console.error('Errore nell\'invio del messaggio di benvenuto:', error);
    throw error;
  }
}

/**
 * Registra l'ingresso del membro nei log
 */
async function logMemberJoin(member, config) {
  try {
    const logChannel = member.guild.channels.cache.get(config.logChannelId);
    
    if (!logChannel) {
      console.warn(`Canale log non trovato: ${config.logChannelId}`);
      return;
    }

    // Verifica permessi del bot
    const botMember = member.guild.members.me;
    if (!logChannel.permissionsFor(botMember).has([
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.EmbedLinks
    ])) {
      console.warn(`Permessi insufficienti nel canale log: ${logChannel.name}`);
      return;
    }

    // Embed per i log
    const logEmbed = new EmbedBuilder()
      .setColor('#00AA00')
      .setAuthor({
        name: '📥 Membro Entrato',
        iconURL: member.user.displayAvatarURL({ dynamic: true })
      })
      .addFields([
        {
          name: 'Utente',
          value: `${member.user.tag} (<@${member.id}>)`,
          inline: false
        },
        {
          name: 'ID',
          value: member.id,
          inline: true
        },
        {
          name: 'Account Creato',
          value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`,
          inline: true
        },
        {
          name: 'Membri Totali',
          value: `${member.guild.memberCount}`,
          inline: true
        }
      ])
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 128 }))
      .setFooter({
        text: `Membro #${member.guild.memberCount}`,
        iconURL: member.guild.iconURL({ dynamic: true })
      })
      .setTimestamp();

    await logChannel.send({ embeds: [logEmbed] });

    console.log(`📝 Log ingresso registrato per ${member.user.tag}`);

  } catch (error) {
    console.error('Errore nella registrazione del log di ingresso:', error);
    throw error;
  }
}
