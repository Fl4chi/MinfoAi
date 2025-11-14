const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Partnership = require('../../database/partnershipSchema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('partnership')
    .setDescription('Gestisci il sistema partnership')
    .addSubcommand(subcommand =>
      subcommand
        .setName('report')
        .setDescription('Segnala una violazione di partnership')
        .addStringOption(option =>
          option
            .setName('server')
            .setDescription('ID del server da segnalare')
            .setRequired(true)
        )
        .addStringOption(option =>
          option
            .setName('motivo')
            .setDescription('Motivo della segnalazione')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    if (interaction.options.getSubcommand() !== 'report') return;

    const serverId = interaction.options.getString('server');
    const reason = interaction.options.getString('motivo');

    try {
      const partnershipReporter = await Partnership.findOne({ serverId: interaction.guildId });
      const partnershipReported = await Partnership.findOne({ serverId: serverId });

      if (!partnershipReporter) {
        return interaction.reply({
          content: '❌ Il tuo server non ha una partnership attiva.',
          ephemeral: true
        });
      }

      if (!partnershipReported) {
        return interaction.reply({
          content: '❌ Il server segnalato non ha una partnership attiva.',
          ephemeral: true
        });
      }

      // Aggiungi violazione
      partnershipReported.violations.push({
        reportedBy: interaction.guildId,
        reason: reason,
        timestamp: new Date()
      });

      // Riduci trust score
      partnershipReported.trustScore = Math.max(0, partnershipReported.trustScore - 25);

      // Sospendi se trust < 20
      if (partnershipReported.trustScore < 20) {
        partnershipReported.status = 'suspended';
      }

      await partnershipReported.save();

      const embed = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('⚠️ Violazione Segnalata')
        .addFields(
          { name: 'Server Segnalato', value: partnershipReported.serverName, inline: true },
          { name: 'Motivo', value: reason, inline: true },
          { name: 'Nuovo Trust Score', value: `${partnershipReported.trustScore}/100`, inline: true },
          { name: 'Stato', value: partnershipReported.status === 'suspended' ? '❌ Sospeso' : '⚠️ Avvertito', inline: false }
        )
        .setFooter({ text: 'Partnership MinfoAi' })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: false });

    } catch (error) {
      console.error('Errore nel report:', error);
      return interaction.reply({
        content: '❌ Errore nel processing della segnalazione.',
        ephemeral: true
      });
    }
  }
};
