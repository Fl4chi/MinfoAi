const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

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
      
      // Dati base garantiti
      const accountCreated = Math.floor(targetUser.createdTimestamp / 1000);
      const joinedServer = member ? Math.floor(member.joinedTimestamp / 1000) : null;
      
      // TODO: Database - questi saranno recuperati dal database
      const userStats = {
        messageCount: 0, // Placeholder - da database
        level: 1, // Placeholder - da database
        xp: 0, // Placeholder - da database
        lastLogin: null, // Placeholder - da database
        preferences: {
          theme: 'Non impostato',
          notifications: 'Attive',
          language: 'IT'
        },
        interests: [
          'Gaming', // Placeholder - da database
          'Programmazione',
          'Musica'
        ],
        reputation: 0, // Placeholder - da database
        warnings: 0, // Placeholder - da database
        achievements: [] // Placeholder - da database
      };
      
      const embed = new EmbedBuilder()
        .setColor('#7289DA')
        .setTitle(`📊 Profilo Completo di ${targetUser.username}`)
        .setThumbnail(targetUser.displayAvatarURL({ dynamic: true, size: 256 }))
        .addFields(
          {
            name: '👤 Informazioni Base',
            value: [
              `**ID:** ${targetUser.id}`,
              `**Username:** ${targetUser.username}`,
              `**Tag:** ${targetUser.tag}`,
              `**Bot:** ${targetUser.bot ? 'Sì' : 'No'}`,
              `**Creazione Account:** <t:${accountCreated}:F> (<t:${accountCreated}:R>)`,
              joinedServer ? `**Entrato nel Server:** <t:${joinedServer}:F> (<t:${joinedServer}:R>)` : ''
            ].filter(Boolean).join('\n'),
            inline: false
          },
          {
            name: '📈 Statistiche Attività',
            value: [
              `**Messaggi Inviati:** ${userStats.messageCount.toLocaleString()}`,
              `**Livello:** ${userStats.level} (${userStats.xp} XP)`,
              `**Reputazione:** ${userStats.reputation > 0 ? '+' : ''}${userStats.reputation}`,
              `**Avvertimenti:** ${userStats.warnings}`,
              userStats.lastLogin ? `**Ultimo Login:** <t:${Math.floor(userStats.lastLogin / 1000)}:R>` : '**Ultimo Login:** Mai'
            ].join('\n'),
            inline: false
          },
          {
            name: '🎯 Gusti e Interessi',
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
          text: `Richiesto da ${interaction.user.username} • Dati aggiornati`,
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
