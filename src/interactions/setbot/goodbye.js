const { EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');

module.exports = {
    customId: 'goodbye',
    
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#FF4444')
            .setTitle('👋 Configurazione Addio')
            .setDescription('Configura il sistema di addio per il tuo server!\n\n' +
                '**Funzionalità disponibili:**\n' +
                '✅ Messaggio personalizzato di addio\n' +
                '✅ Embed premium personalizzabile\n' +
                '✅ Statistiche membri\n' +
                '✅ Canale dedicato per gli addii\n\n' +
                'Seleziona cosa vuoi configurare:')
            .addFields(
                {
                    name: '📝 Stato Attuale',
                    value: '```\nCanale: Non configurato\nMessaggio: Non configurato\nStato: Disabilitato\n```',
                    inline: false
                }
            )
            .setFooter({
                text: `Configurazione richiesta da ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('goodbye_config_option')
            .setPlaceholder('🔧 Seleziona un\'opzione da configurare')
            .addOptions(
                {
                    label: 'Imposta Canale',
                    description: 'Scegli il canale per i messaggi di addio',
                    value: 'goodbye_set_channel',
                    emoji: '📝'
                },
                {
                    label: 'Messaggio Personalizzato',
                    description: 'Crea un messaggio di addio custom',
                    value: 'goodbye_set_message',
                    emoji: '✏️'
                },
                {
                    label: 'Colore Embed',
                    description: 'Personalizza il colore dell\'embed',
                    value: 'goodbye_set_color',
                    emoji: '🎨'
                },
                {
                    label: 'Test Addio',
                    description: 'Invia un messaggio di test',
                    value: 'goodbye_test',
                    emoji: '🧪'
                }
            );

        const channelSelect = new ChannelSelectMenuBuilder()
            .setCustomId('goodbye_channel_select')
            .setPlaceholder('📍 Seleziona il canale di addio')
            .addChannelTypes(ChannelType.GuildText);

        const enableButton = new ButtonBuilder()
            .setCustomId('goodbye_toggle')
            .setLabel('Abilita Addio')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅');

        const backButton = new ButtonBuilder()
            .setCustomId('setbot_back')
            .setLabel('Torna Indietro')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('⬅️');

        const row1 = new ActionRowBuilder().addComponents(selectMenu);
        const row2 = new ActionRowBuilder().addComponents(channelSelect);
        const row3 = new ActionRowBuilder().addComponents(enableButton, backButton);

        await interaction.update({
            embeds: [embed],
            components: [row1, row2, row3],
            ephemeral: true
        });
    }
};
