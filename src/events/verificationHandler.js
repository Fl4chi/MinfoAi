const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');

module.exports = {
  name: 'interactionCreate',
  
  async execute(interaction) {
    // Gestione bottone verifica
    if (interaction.isButton() && interaction.customId === 'verify_button') {
      try {
        // Check permessi utente
        const member = interaction.member;
        
        // Verifica se l'utente ha già il ruolo verificato
        const verifiedRole = interaction.guild.roles.cache.find(role => role.name === 'Verificato');
        if (!verifiedRole) {
          return interaction.reply({ 
            content: '❌ Ruolo verificato non trovato. Contatta un amministratore.', 
            ephemeral: true 
          });
        }

        if (member.roles.cache.has(verifiedRole.id)) {
          return interaction.reply({ 
            content: '✅ Sei già verificato!', 
            ephemeral: true 
          });
        }

        // Assegna ruolo verificato
        await member.roles.add(verifiedRole);

        // Log accesso
        const logChannel = interaction.guild.channels.cache.find(ch => ch.name === 'verification-logs');
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('✅ Nuova Verifica')
            .setDescription(`**Utente:** ${member.user.tag} (${member.user.id})\n**Data:** ${new Date().toLocaleString('it-IT')}\n**Ruolo assegnato:** ${verifiedRole.name}`)
            .setTimestamp();
          
          await logChannel.send({ embeds: [logEmbed] });
        }

        // Gestione onboarding - Welcome message
        const welcomeEmbed = new EmbedBuilder()
          .setColor('#0099ff')
          .setTitle('🎉 Benvenuto in MinfoAi!')
          .setDescription(
            `Ciao ${member.user.username}!\n\n` +
            `Grazie per esserti verificato. Ora hai accesso a tutti i canali del server!\n\n` +
            `**📋 Cosa puoi fare ora:**\n` +
            `• Leggi le regole in <#regole>\n` +
            `• Presentati in <#presentazioni>\n` +
            `• Partecipa alle discussioni\n` +
            `• Divertiti con la community!\n\n` +
            `Se hai domande, chiedi pure agli staff!`
          )
          .setThumbnail(member.user.displayAvatarURL())
          .setTimestamp();

        await interaction.reply({ embeds: [welcomeEmbed], ephemeral: true });

      } catch (error) {
        console.error('Errore durante la verifica:', error);
        await interaction.reply({ 
          content: '❌ Si è verificato un errore. Riprova più tardi.', 
          ephemeral: true 
        });
      }
    }

    // Comando per creare il bottone di verifica (solo admin)
    if (interaction.isChatInputCommand() && interaction.commandName === 'setup-verify') {
      // Check permessi admin
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ 
          content: '❌ Non hai i permessi per usare questo comando.', 
          ephemeral: true 
        });
      }

      const verifyEmbed = new EmbedBuilder()
        .setColor('#5865F2')
        .setTitle('🔐 Verifica Account')
        .setDescription(
          '**Benvenuto in MinfoAi!**\n\n' +
          'Per accedere al server, clicca il bottone qui sotto per verificare il tuo account.\n\n' +
          '✅ Dopo la verifica avrai accesso a tutti i canali!'
        )
        .setFooter({ text: 'Sistema di verifica MinfoAi' });

      const verifyButton = new ButtonBuilder()
        .setCustomId('verify_button')
        .setLabel('✓ Verifica')
        .setStyle(ButtonStyle.Success);

      const row = new ActionRowBuilder().addComponents(verifyButton);

      await interaction.channel.send({ embeds: [verifyEmbed], components: [row] });
      await interaction.reply({ content: '✅ Pannello di verifica creato!', ephemeral: true });
    }
  }
};
