const { SlashCommandBuilder, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const Partnership = require('../../database/partnershipSchema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('partnership')
    .setDescription('Gestisci il sistema partnership')
    .addSubcommand(subcommand =>
      subcommand
        .setName('request')
        .setDescription('Richiedi di diventare un server partner')
    ),

  async execute(interaction) {
    if (interaction.options.getSubcommand() !== 'request') return;

    // Verifica se l'utente è un admin del server
    if (!interaction.member.permissions.has('ADMINISTRATOR')) {
      return interaction.reply({
        content: '❌ Solo gli admin del server possono richiedere una partnership.',
        ephemeral: true
      });
    }

    // Verifica se il server ha già una partnership
    const existingPartnership = await Partnership.findOne({ serverId: interaction.guildId });
    if (existingPartnership) {
      return interaction.reply({
        content: '❌ Il tuo server ha già una partnership attiva!',
        ephemeral: true
      });
    }

    // Crea il modal per la richiesta
    const modal = new ModalBuilder()
      .setCustomId('partnership_request_modal')
      .setTitle('Richiesta Partnership');

    const serverNameInput = new TextInputBuilder()
      .setCustomId('server_name')
      .setLabel('Nome del server')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setMaxLength(100);

    const descriptionInput = new TextInputBuilder()
      .setCustomId('server_description')
      .setLabel('Descrizione del server')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true)
      .setMaxLength(500);

    const membersInput = new TextInputBuilder()
      .setCustomId('server_members')
      .setLabel('Numero di membri')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const categoryInput = new TextInputBuilder()
      .setCustomId('server_category')
      .setLabel('Categoria (Gaming/Sociale/Comunità/Altro)')
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const rulesInput = new TextInputBuilder()
      .setCustomId('server_rules')
      .setLabel('Confermi di accettare le regole partnership?')
      .setStyle(TextInputStyle.Short)
      .setRequired(true)
      .setPlaceholder('Scrivi: Si');

    const row1 = new ActionRowBuilder().addComponents(serverNameInput);
    const row2 = new ActionRowBuilder().addComponents(descriptionInput);
    const row3 = new ActionRowBuilder().addComponents(membersInput);
    const row4 = new ActionRowBuilder().addComponents(categoryInput);
    const row5 = new ActionRowBuilder().addComponents(rulesInput);

    modal.addComponents(row1, row2, row3, row4, row5);

    await interaction.showModal(modal);
  },

  // Handler per il modal
  async handleModal(interaction) {
    if (interaction.customId !== 'partnership_request_modal') return;

    const serverName = interaction.fields.getTextInputValue('server_name');
    const description = interaction.fields.getTextInputValue('server_description');
    const members = parseInt(interaction.fields.getTextInputValue('server_members'));
    const category = interaction.fields.getTextInputValue('server_category');
    const rules = interaction.fields.getTextInputValue('server_rules');

    // Validazione
    if (isNaN(members) || members < 5) {
      return interaction.reply({
        content: '❌ Il server deve avere almeno 5 membri!',
        ephemeral: true
      });
    }

    if (rules.toLowerCase() !== 'si') {
      return interaction.reply({
        content: '❌ Devi accettare le regole della partnership per continuare.',
        ephemeral: true
      });
    }

    try {
      // Crea nuovo record partnership
      const partnership = new Partnership({
        serverId: interaction.guildId,
        serverName: serverName,
        serverOwner: interaction.user.id,
        description: description,
        memberCount: members,
        category: category,
        tier: 'Bronze',
        trustScore: 50,
        status: 'active',
        createdAt: new Date(),
        referralCount: 0,
        violations: []
      });

      await partnership.save();

      // Embed di conferma
      const confirmEmbed = new EmbedBuilder()
        .setColor('#00ff00')
        .setTitle('✅ Partnership Approvata!')
        .setDescription(`Benvenuto nel programma partnership MinfoAi!`)
        .addFields(
          { name: 'Server', value: serverName, inline: true },
          { name: 'Tier', value: 'Bronze 🥉', inline: true },
          { name: 'Trust Score', value: '50/100', inline: true },
          { name: 'Categoria', value: category, inline: true },
          { name: 'Membri', value: members.toString(), inline: true },
          { name: 'Vantaggi', value: '✅ Ban List Sharing\n✅ Community Support', inline: false },
          { name: 'Prossimo Step', value: 'Visita `/partnership view` per i dettagli', inline: false }
        )
        .setTimestamp();

      await interaction.reply({
        embeds: [confirmEmbed],
        ephemeral: true
      });

    } catch (error) {
      console.error('Errore nel salvare partnership:', error);
      await interaction.reply({
        content: '❌ Errore durante la creazione della partnership. Riprova più tardi.',
        ephemeral: true
      });
    }
  }
};
