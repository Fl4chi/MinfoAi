const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const { logError } = require('../errors/errorHandler');

module.exports = {
  name: 'guildMemberRemove',
  async execute(member) {
    try {
      const guild = member.guild;
      
      // Configurazione predefinita (può essere personalizzata tramite database)
      const config = {
        goodbyeChannelId: process.env.GOODBYE_CHANNEL_ID,
        logChannelId: process.env.LOG_CHANNEL_ID,
        goodbyeMessage: process.env.GOODBYE_MESSAGE || 'Addio **{username}** 😭\n\nGrazie per aver fatto parte della comunità **{guild}**!\n\nSperiamo di rivederti presto!',
        embedColor: '#FF4444',
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

/**
 * Invia il messaggio di addio personalizzato
 */
async function sendGoodbyeMessage(member, config) {
  try {
    const goodbyeChannel = member.guild.channels.cache.get(config.goodbyeChannelId);
    
    if (!goodbyeChannel) {
      console.warn(`Canale di addio non trovato: ${config.goodbyeChannelId}`);
      return;
    }

    // Verifica permessi del bot
    const botMember = member.guild.members.me;
    if (!goodbyeChannel.permissionsFor(botMember).has([
      PermissionsBitField.Flags.SendMessages,
      PermissionsBitField.Flags.EmbedLinks
    ])) {
      console.warn(`Permessi insufficienti nel canale di addio: ${goodbyeChannel.name}`);
      return;
    }

    // Personalizzazione del messaggio
    const personalizedMessage = config.goodbyeMessage
      .replace(/{user}/g, `<@${member.id}>`)
      .replace(/{guild}/g, member.guild.name)
      .replace(/{memberCount}/g, member.guild.memberCount)
      .replace(/{username}/g, member.user.username);

    // Creazione embed di addio
    const goodbyeEmbed = new EmbedBuilder()
      .setColor(config.embedColor)
      .setTitle('😭 Membro Partito')
      .setDescription(personalizedMessage)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields([
        {
          name: '👤 Utente',
          value: `${member.user.tag}`,
          inline: true
        },
        {
          name: '📅 Si è unito',
          value: member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : 'Sconosciuto',
          inline: true
        },
        {
          name: '📊 Membri Rimasti',
          value: `${member.guild.memberCount}`,
          inline: true
        },
        {
          name: '⏰ Tempo nel server',
          value: member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : 'Sconosciuto',
          inline: false
        }
      ])
      .setFooter({
        text: `ID: ${member.id} • ${member.guild.name}`,
        iconURL: member.guild.iconURL({ dynamic: true })
      })
      .setTimestamp();

    await goodbyeChannel.send({
      embeds: [goodbyeEmbed]
    });

    console.log(`✅ Messaggio di addio inviato per ${member.user.tag} in ${goodbyeChannel.name}`);

  } catch (error) {
    console.error('Errore nell\'invio del messaggio di addio:', error);
    throw error;
  }
}

/**
 * Registra l'uscita del membro nei log
 */
async function logMemberLeave(member, config) {
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

    // Calcola i ruoli che aveva il membro (se disponibili)
    const memberRoles = member.roles?.cache
      ?.filter(role => role.id !== member.guild.id)
      ?.map(role => role.name)
      ?.join(', ') || 'Nessun ruolo';

    // Embed per i log
    const logEmbed = new EmbedBuilder()
      .setColor('#AA0000')
      .setAuthor({
        name: '📤 Membro Uscito',
        iconURL: member.user.displayAvatarURL({ dynamic: true })
      })
      .addFields([
        {
          name: 'Utente',
          value: `${member.user.tag} (${member.id})`,
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
          name: 'Si era unito',
          value: member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:F>` : 'Sconosciuto',
          inline: true
        },
        {
          name: 'Tempo nel server',
          value: member.joinedAt ? `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>` : 'Sconosciuto',
          inline: true
        },
        {
          name: 'Membri Rimasti',
          value: `${member.guild.memberCount}`,
          inline: true
        },
        {
          name: 'Ruoli',
          value: memberRoles,
          inline: false
        }
      ])
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 128 }))
      .setFooter({
        text: `Membri rimanenti: ${member.guild.memberCount}`,
        iconURL: member.guild.iconURL({ dynamic: true })
      })
      .setTimestamp();

    await logChannel.send({ embeds: [logEmbed] });

    console.log(`📝 Log uscita registrato per ${member.user.tag}`);

  } catch (error) {
    console.error('Errore nella registrazione del log di uscita:', error);
    throw error;
  }
}
