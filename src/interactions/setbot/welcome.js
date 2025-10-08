const { EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');

module.exports = {
    customId: 'welcome',
    
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#00FF7F')
            .setTitle('👋 Configurazione Benvenuto')
            .setDescription('Configura il sistema di benvenuto per il tuo server!\n\n' +
                '**Funzionalità disponibili:**\n' +
                '✅ Messaggio personalizzato con variabili dinamiche\n' +
                '✅ Embed premium con colori personalizzabili\n' +
                '✅ Immagini di benvenuto automatiche\n' +
                '✅ Ruoli automatici al join\n' +
                '✅ Canale di benvenuto dedicato\n\n' +
                'Seleziona cosa vuoi configurare:')
            .addFields(
                {
                    name: '📝 Stato Attuale',
                    value: '```\nCanale: Non configurato\nMessaggio: Non configurato\nRuolo Auto: Disabilitato\n```',
                    inline: false
                }
            )
            .setFooter({
                text: `Configurazione richiesta da ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('welcome_config_option')
            .setPlaceholder('🔧 Seleziona un\'opzione da configurare')
            .addOptions(
                {
                    label: 'Imposta Canale',
                    description: 'Scegli il canale per i messaggi di benvenuto',
                    value: 'welcome_set_channel',
                    emoji: '📝'
                },
                {
                    label: 'Messaggio Personalizzato',
                    description: 'Crea un messaggio di benvenuto custom',
                    value: 'welcome_set_message',
                    emoji: '✏️'
                },
                {
                    label: 'Colore Embed',
                    description: 'Personalizza il colore dell\'embed',
                    value: 'welcome_set_color',
                    emoji: '🎨'
                },
                {
                    label: 'Ruolo Automatico',
                    description: 'Assegna un ruolo automaticamente ai nuovi membri',
                    value: 'welcome_auto_role',
                    emoji: '🎭'
                },
                {
                    label: 'Immagine di Benvenuto',
                    description: 'Abilita/disabilita immagini automatiche',
                    value: 'welcome_image',
                    emoji: '🖼️'
                },
                {
                    label: 'Test Benvenuto',
                    description: 'Invia un messaggio di test',
                    value: 'welcome_test',
                    emoji: '🧪'
                }
            );

        const channelSelect = new ChannelSelectMenuBuilder()
            .setCustomId('welcome_channel_select')
            .setPlaceholder('📍 Seleziona il canale di benvenuto')
            .addChannelTypes(ChannelType.GuildText);

        const enableButton = new ButtonBuilder()
            .setCustomId('welcome_toggle')
            .setLabel('Abilita Benvenuto')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅');

        const backButton = new ButtonBuilder()
            .setCustomId('setbot_back')
            .setLabel('Torna Indietro')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('⬅️');

        const previewButton = new ButtonBuilder()
            .setCustomId('welcome_preview')
            .setLabel('Anteprima')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('👁️');

        const row1 = new ActionRowBuilder().addComponents(selectMenu);
        const row2 = new ActionRowBuilder().addComponents(channelSelect);
        const row3 = new ActionRowBuilder().addComponents(enableButton, previewButton, backButton);

        await interaction.update({
            embeds: [embed],
            components: [row1, row2, row3],
            ephemeral: true
        });
    }
};
