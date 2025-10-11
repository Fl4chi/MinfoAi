const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const User = require('../database/models/User');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Mostra tutte le informazioni complete su un utente')
    .addUserOption(option =>
      option
        .setName('utente')
        .setDescription('L\'utente di cui visualizzare le informazioni')
        .setRequired(false)
    ),

  async execute(interaction) {
    try {
      const targetUser = interaction.options.getUser('utente') || interaction.user;
      const member = interaction.guild?.members.cache.get(targetUser.id);
      
      // Dati base garantiti da Discord
      const accountCreated = Math.floor(targetUser.createdTimestamp / 1000);
      const joinedServer = member ? Math.floor(member.joinedTimestamp / 1000) : null;
      
      // Recupera dati reali dal database
      let userData = await User.findOne({
        userId: targetUser.id,
        guildId: interaction.guild.id
      });
      
      // Se l'utente non esiste nel database, crea un nuovo record con valori di default
      if (!userData) {
        userData = await User.create({
          userId: targetUser.id,
          guildId: interaction.guild.id,
          xp: 0,
          level: 1,
          messageCount: 0,
          lastLogin: new Date(),
          preferences: {
            language: 'IT',
            notifications: true,
            theme: 'default'
          },
          interests: [],
          warnings: 0,
          achievements: []
        });
      }
      
      // Prepara i dati per la visualizzazione
      const userStats = {
        messageCount: userData.messageCount || 0,
        level: userData.level || 1,
        xp: userData.xp || 0,
        lastLogin: userData.lastLogin ? Math.floor(new Date(userData.lastLogin).getTime() / 1000) : null,
        preferences: {
          theme: userData.preferences?.theme || 'Non impostato',
          notifications: userData.preferences?.notifications ? 'Attive' : 'Disattivate',
          language: userData.preferences?.language || 'IT'
        },
        interests: userData.interests || [],
        warnings: userData.warnings || 0,
        achievements: userData.achievements || []
      };
      
      const embed = new EmbedBuilder()
        .setColor('#7289DA')
        .setTitle(`📊 Profilo Completo di ${targetUser.username}`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
        .addFields(
          {
            name: '👤 Informazioni Base',
            value: [
              `**ID Utente:** ${targetUser.id}`,
              `**Username:** ${targetUser.username}`,
              `**Tag:** ${targetUser.tag}`,
              `**Bot:** ${targetUser.bot ? 'Sì' : 'No'}`,
              `**Data Creazione Account:** <t:${accountCreated}:F> (<t:${accountCreated}:R>)`,
              joinedServer ? `**Entrato nel Server:** <t:${joinedServer}:F> (<t:${joinedServer}:R>)` : ''
            ].filter(Boolean).join('\n'),
            inline: false
          },
          {
            name: '📈 Statistiche Server',
            value: [
              `**Livello:** ${userStats.level}`,
              `**XP:** ${userStats.xp}`,
              `**Messaggi Inviati:** ${userStats.messageCount}`,
              userStats.lastLogin ? `**Ultimo Accesso:** <t:${userStats.lastLogin}:R>` : '**Ultimo Accesso:** Mai',
              `**Warnings:** ${userStats.warnings}`
            ].join('\n'),
            inline: true
          },
          {
            name: '🎯 Interessi',
            value: userStats.interests.length > 0
              ? userStats.interests.map(i => `• ${i}`).join('\n')
              : 'Nessun interesse registrato',
            inline: true
          },
          {
            name: '⚙️ Preferenze',
            value: [
              `**Tema:** ${userStats.preferences.theme}`,
              `**Notifiche:** ${userStats.preferences.notifications}`,
              `**Lingua:** ${userStats.preferences.language}`
            ].join('\n'),
            inline: true
          }
        );
      
      // Aggiungi ruoli se è un membro del server
      if (member && member.roles.cache.size > 1) {
        const roles = member.roles.cache
          .filter(role => role.id !== interaction.guild.id)
          .sort((a, b) => b.position - a.position)
          .map(role => role.toString())
          .slice(0, 10);
        
        embed.addFields({
          name: `🎭 Ruoli (${member.roles.cache.size - 1})`,
          value: roles.join(', ') || 'Nessun ruolo',
          inline: false
        });
      }
      
      // Aggiungi achievements se presenti
      if (userStats.achievements.length > 0) {
        embed.addFields({
          name: '🏆 Achievement Sbloccati',
          value: userStats.achievements.slice(0, 5).join('\n') || 'Nessun achievement',
          inline: false
        });
      }
      
      embed
        .setFooter({
          text: `Richiesto da ${interaction.user.username} • Dati dal database`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp();
      
      await interaction.reply({ embeds: [embed] });
      
    } catch (error) {
      console.error('Errore nel comando info:', error);
      const errorMsg = '❌ Si è verificato un errore durante il recupero delle informazioni.';
      
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMsg, ephemeral: true });
      } else {
        await interaction.reply({ content: errorMsg, ephemeral: true });
      }
    }
  }
};
