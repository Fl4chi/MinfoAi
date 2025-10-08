const { EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');

module.exports = {
    customId: 'giveaway',
    
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#E91E63')
            .setTitle('🎁 Configurazione Giveaway')
            .setDescription('Configura il sistema giveaway per il tuo server!\n\n' +
                '**Funzionalità disponibili:**\n' +
                '✅ Giveaway automatici programmabili\n' +
                '✅ Requisiti personalizzabili (ruoli, livelli)\n' +
                '✅ Sistema anti-bot e anti-alt\n' +
                '✅ Riestrazione automatica vincitori\n' +
                '✅ Notifiche automatiche\n\n' +
                'Seleziona cosa vuoi configurare:')
            .addFields(
                {
                    name: '📝 Stato Attuale',
                    value: '```\nGiveaway Attivi: 0\nCanale Default: Non configurato\nRuolo Ping: Non configurato\n```',
                    inline: false
                }
            )
            .setFooter({
                text: `Configurazione richiesta da ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('giveaway_config_option')
            .setPlaceholder('🔧 Seleziona un\'opzione da configurare')
            .addOptions(
                {
                    label: 'Crea Giveaway',
                    description: 'Avvia un nuovo giveaway',
                    value: 'giveaway_create',
                    emoji: '🎉'
                },
                {
                    label: 'Canale Default',
                    description: 'Imposta canale predefinito per giveaway',
                    value: 'giveaway_set_channel',
                    emoji: '📝'
                },
                {
                    label: 'Ruolo Ping',
                    description: 'Ruolo da pingare per nuovi giveaway',
                    value: 'giveaway_ping_role',
                    emoji: '🔔'
                },
                {
                    label: 'Requisiti',
                    description: 'Imposta requisiti per partecipare',
                    value: 'giveaway_requirements',
                    emoji: '✅'
                },
                {
                    label: 'Giveaway Attivi',
                    description: 'Visualizza e gestisci giveaway in corso',
                    value: 'giveaway_list',
                    emoji: '📋'
                }
            );

        const channelSelect = new ChannelSelectMenuBuilder()
            .setCustomId('giveaway_channel_select')
            .setPlaceholder('📍 Seleziona il canale giveaway')
            .addChannelTypes(ChannelType.GuildText);

        const createButton = new ButtonBuilder()
            .setCustomId('giveaway_create_quick')
            .setLabel('Crea Giveaway Rapido')
            .setStyle(ButtonStyle.Success)
            .setEmoji('🎁');

        const backButton = new ButtonBuilder()
            .setCustomId('setbot_back')
            .setLabel('Torna Indietro')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('⬅️');

        const row1 = new ActionRowBuilder().addComponents(selectMenu);
        const row2 = new ActionRowBuilder().addComponents(channelSelect);
        const row3 = new ActionRowBuilder().addComponents(createButton, backButton);

        await interaction.update({
            embeds: [embed],
            components: [row1, row2, row3],
            ephemeral: true
        });
    }
};
