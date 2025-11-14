// Partnership Command Router
const { SlashCommandBuilder } = require('discord.js');
const request = require('./request');
const view = require('./view');
const stats = require('./stats');
const report = require('./report');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('partnership')
    .setDescription('Gestisci il sistema partnership del tuo server')
    .addSubcommand(subcommand =>
      subcommand
        .setName('request')
        .setDescription('Richiedi di diventare un server partner')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('Visualizza i dettagli della tua partnership')
    )
    .addSubcommand(subcommand =>
      subcommand
        .setName('stats')
        .setDescription('Visualizza statistiche della partnership')
    )
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
    const subcommand = interaction.options.getSubcommand();

    try {
      switch (subcommand) {
        case 'request':
          await request.execute(interaction);
          if (interaction.customId === 'partnership_request_modal') {
            await request.handleModal(interaction);
          }
          break;
        case 'view':
          await view.execute(interaction);
          break;
        case 'stats':
          await stats.execute(interaction);
          break;
        case 'report':
          await report.execute(interaction);
          break;
        default:
          await interaction.reply({
            content: '❌ Subcommand non riconosciuto.',
            ephemeral: true
          });
      }
    } catch (error) {
      console.error('Errore nel partnership command:', error);
      await interaction.reply({
        content: '❌ Si è verificato un errore.',
        ephemeral: true
      }).catch(() => {});
    }
  },

  async handleModalSubmit(interaction) {
    if (interaction.customId === 'partnership_request_modal') {
      await request.handleModal(interaction);
    }
  }
};
