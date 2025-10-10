const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const User = require('../database/models/User');
const Message = require('../database/models/Message');
const ActivityLog = require('../database/models/ActivityLog');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Mostra informazioni dettagliate su un utente')
    .addUserOption(option =>
      option
        .setName('utente')
        .setDescription('L\'utente di cui visualizzare le informazioni')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      // Ottieni l'utente target (utente menzionato o chi esegue il comando)
      const targetUser = interaction.options.getUser('utente') || interaction.user;
      const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);

      if (!member) {
        return await interaction.reply({
          content: '❌ Utente non trovato nel server.',
          ephemeral: true
        });
      }

      await interaction.deferReply();

      // Recupera i dati dal database
      const userData = await User.findOne({
        where: {
          userId: targetUser.id,
          guildId: interaction.guild.id
        }
      });

      // Recupera i messaggi dell'utente
      const messages = await Message.findAll({
        where: {
          userId: targetUser.id,
          guildId: interaction.guild.id
        }
      });

      // Recupera i log di attività
      const activityLogs = await ActivityLog.findAll({
        where: {
          userId: targetUser.id,
          guildId: interaction.guild.id
        },
        limit: 1000,
        order: [['createdAt', 'DESC']]
      });

      // Calcola statistiche
      const totalMessages = messages.length;
      const xp = userData?.xp || 0;
      const level = userData?.level || 0;

      // Analizza orari di attività
      const activityByHour = {};
      for (let i = 0; i < 24; i++) {
        activityByHour[i] = 0;
      }

      messages.forEach(msg => {
        const hour = new Date(msg.createdAt).getHours();
        activityByHour[hour]++;
      });

      // Trova gli orari più attivi
      const topHours = Object.entries(activityByHour)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([hour, count]) => `${hour}:00-${hour}:59 (${count} msg)`);

      // Analizza canali più usati
      const channelUsage = {};
      messages.forEach(msg => {
        channelUsage[msg.channelId] = (channelUsage[msg.channelId] || 0) + 1;
      });

      const topChannels = Object.entries(channelUsage)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([channelId, count]) => {
          const channel = interaction.guild.channels.cache.get(channelId);
          return channel ? `<#${channelId}> (${count} msg)` : `Canale sconosciuto (${count} msg)`;
        });

      // Analizza parole più ricorrenti
      const wordFrequency = {};
      const stopWords = ['il', 'lo', 'la', 'i', 'gli', 'le', 'un', 'uno', 'una', 'di', 'a', 'da', 'in', 'con', 'su', 'per', 'tra', 'fra', 'e', 'o', 'ma', 'se', 'non', 'che', 'come', 'quando', 'dove', 'chi', 'cosa', 'perché'];

      messages.forEach(msg => {
        if (msg.content) {
          const words = msg.content
            .toLowerCase()
            .replace(/[^a-zàèéìòùá-ü\s]/gi, '')
            .split(/\s+/)
            .filter(word => word.length > 3 && !stopWords.includes(word));

          words.forEach(word => {
            wordFrequency[word] = (wordFrequency[word] || 0) + 1;
          });
        }
      });

      const topWords = Object.entries(wordFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([word, count]) => `${word} (${count}x)`);

      // Determina badge
      const badges = [];
      if (member.permissions.has(PermissionFlagsBits.Administrator)) {
        badges.push('👑 Admin');
      }
      if (member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
        badges.push('🛡️ Staff');
      }
      if (targetUser.bot) {
        badges.push('🤖 Bot');
      }
      if (member.premiumSince) {
        badges.push('💎 Server Booster');
      }
      if (level >= 50) {
        badges.push('⭐ Utente Leggendario');
      } else if (level >= 30) {
        badges.push('🌟 Utente Esperto');
      } else if (level >= 10) {
        badges.push('✨ Utente Attivo');
      }
      if (totalMessages >= 10000) {
        badges.push('💬 Chiacchierone');
      } else if (totalMessages >= 5000) {
        badges.push('📝 Conversatore');
      }

      // Data di creazione dell'account
      const accountCreated = Math.floor(targetUser.createdTimestamp / 1000);
      // Data di ingresso nel server
      const joinedServer = member.joinedTimestamp ? Math.floor(member.joinedTimestamp / 1000) : null;

      // Crea l'embed premium
      const embed = new EmbedBuilder()
        .setColor('#7289DA')
        .setTitle(`📊 Profilo di ${targetUser.username}`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
        .addFields(
          {
            name: '👤 Informazioni Base',
            value: [
              `**ID:** ${targetUser.id}`,
              `**Username:** ${targetUser.username}`,
              `**Tag:** ${targetUser.tag}`,
              `**Creazione Account:** <t:${accountCreated}:D> (<t:${accountCreated}:R>)`,
              joinedServer ? `**Entrato nel Server:** <t:${joinedServer}:D> (<t:${joinedServer}:R>)` : '**Entrato nel Server:** N/A'
            ].join('\n'),
            inline: false
          },
          {
            name: '📈 Statistiche di Attività',
            value: [
              `**XP:** ${xp.toLocaleString()}`,
              `**Livello:** ${level}`,
              `**Messaggi Totali:** ${totalMessages.toLocaleString()}`
            ].join('\n'),
            inline: true
          },
          {
            name: '🕐 Orari di Attività',
            value: topHours.length > 0 ? topHours.join('\n') : 'Nessun dato disponibile',
            inline: true
          },
          {
            name: '📢 Canali Più Usati',
            value: topChannels.length > 0 ? topChannels.join('\n') : 'Nessun dato disponibile',
            inline: false
          },
          {
            name: '💭 Parole/Argomenti Ricorrenti',
            value: topWords.length > 0 ? topWords.join(', ') : 'Nessun dato disponibile',
            inline: false
          },
          {
            name: '🏆 Badge',
            value: badges.length > 0 ? badges.join('\n') : 'Nessun badge',
            inline: false
          }
        )
        .setFooter({
          text: `Richiesto da ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp();

      await interaction.editReply({ embeds: [embed] });

    } catch (error) {
      console.error('Errore nel comando info:', error);
      
      const errorMessage = {
        content: '❌ Si è verificato un errore durante il recupero delle informazioni.',
        ephemeral: true
      };

      if (interaction.deferred) {
        await interaction.editReply(errorMessage);
      } else {
        await interaction.reply(errorMessage);
      }
    }
  }
};
