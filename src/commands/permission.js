const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

// Simple in-memory policy store (per guild)
// Values: 'owner' | 'admin'
// Attach to client at runtime (e.g., client.setbotPolicy = {})
module.exports = {
  data: new SlashCommandBuilder()
    .setName('permission')
    .setDescription('Imposta chi può usare /setbot (solo owner del server)')
    .addStringOption(o =>
      o.setName('livello')
       .setDescription('Chi può usare /setbot')
       .setRequired(true)
       .addChoices(
         { name: 'Solo proprietario', value: 'owner' },
         { name: 'Amministratori', value: 'admin' },
       )
    )
    .setDMPermission(false),

  async execute(interaction) {
    const isOwner = interaction.guild?.ownerId === interaction.user.id;
    if (!isOwner) {
      return interaction.reply({ content: 'Questo comando può essere usato solo dal proprietario del server.', ephemeral: true });
    }

    const level = interaction.options.getString('livello', true); // 'owner' | 'admin'

    if (!interaction.client.setbotPolicy) interaction.client.setbotPolicy = {};
    interaction.client.setbotPolicy[interaction.guildId] = level;

    const e = new EmbedBuilder()
      .setColor('#57F287')
      .setTitle('Permessi /setbot aggiornati')
      .setDescription(level === 'owner'
        ? 'Solo il proprietario del server può eseguire /setbot.'
        : 'Il proprietario e gli amministratori possono eseguire /setbot.'
      )
      .setFooter({ text: `Server: ${interaction.guild?.name || 'N/D'}` });

    return interaction.reply({ embeds: [e], ephemeral: true });
  }
};
