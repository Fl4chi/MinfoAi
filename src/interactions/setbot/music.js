const { EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');

module.exports = {
    customId: 'music',
    
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#9B59B6')
            .setTitle('🎵 Configurazione Musica')
            .setDescription('Configura il sistema musicale per il tuo server!\n\n' +
                '**Funzionalità disponibili:**\n' +
                '✅ Canale dedicato per i comandi musicali\n' +
                '✅ Limitazione utenti in coda\n' +
                '✅ Volume predefinito\n' +
                '✅ Filtri audio disponibili\n' +
                '✅ Modalità DJ\n\n' +
                'Seleziona cosa vuoi configurare:')
            .addFields(
                {
                    name: '📝 Stato Attuale',
                    value: '```\nCanale Musica: Non configurato\nVolume Default: 50%\nModo DJ: Disabilitato\n```',
                    inline: false
                }
            )
            .setFooter({
                text: `Configurazione richiesta da ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('music_config_option')
            .setPlaceholder('🔧 Seleziona un\'opzione da configurare')
            .addOptions(
                {
                    label: 'Canale Musica',
                    description: 'Scegli il canale per i comandi musicali',
                    value: 'music_set_channel',
                    emoji: '📝'
                },
                {
                    label: 'Volume Predefinito',
                    description: 'Imposta il volume di default (0-100)',
                    value: 'music_set_volume',
                    emoji: '🔊'
                },
                {
                    label: 'Modo DJ',
                    description: 'Abilita/disabilita ruolo DJ richiesto',
                    value: 'music_dj_mode',
                    emoji: '🎧'
                },
                {
                    label: 'Limiti Coda',
                    description: 'Imposta massimo canzoni per utente',
                    value: 'music_queue_limit',
                    emoji: '📋'
                }
            );

        const backButton = new ButtonBuilder()
            .setCustomId('setbot_back')
            .setLabel('Torna Indietro')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('⬅️');

        const row1 = new ActionRowBuilder().addComponents(selectMenu);
        const row2 = new ActionRowBuilder().addComponents(backButton);

        await interaction.update({
            embeds: [embed],
            components: [row1, row2],
            ephemeral: true
        });
    }
};
