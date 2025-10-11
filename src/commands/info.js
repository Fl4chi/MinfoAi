const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Mostra informazioni base su un utente')
    .addUserOption(option =>
      option
        .setName('utente')
        .setDescription('L\'utente di cui visualizzare le informazioni')
        .setRequired(false)
    ),
  async execute(interaction) {
    try {
      const targetUser = interaction.options.getUser('utente') || interaction.user;
      const member = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
      
      if (!member) {
        return await interaction.reply({
          content: '❌ Utente non trovato nel server.',
          ephemeral: true
        });
      }

      const accountCreated = Math.floor(targetUser.createdTimestamp / 1000);
      const joinedServer = member.joinedTimestamp ? Math.floor(member.joinedTimestamp / 1000) : null;

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
              `**Creazione Account:** <t:${accountCreated}:F> (<t:${accountCreated}:R>)`,
              joinedServer ? `**Entrato nel Server:** <t:${joinedServer}:F> (<t:${joinedServer}:R>)` : '**Entrato nel Server:** N/A'
            ].join('\n'),
            inline: false
          }
        )
        .setFooter({
          text: `Richiesto da ${interaction.user.username}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true })
        })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error('Errore nel comando info:', error);
      await interaction.reply({
        content: '❌ Si è verificato un errore durante il recupero delle informazioni.',
        ephemeral: true
      });
    }
  }
};
