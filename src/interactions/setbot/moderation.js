const { EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');

module.exports = {
    customId: 'moderation',
    
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#E74C3C')
            .setTitle('🛡️ Configurazione Moderazione')
            .setDescription('Configura il sistema di moderazione per il tuo server!\n\n' +
                '**Funzionalità disponibili:**\n' +
                '✅ Auto-moderazione spam e flood\n' +
                '✅ Filtro parole proibite\n' +
                '✅ Sistema warn/kick/ban automatico\n' +
                '✅ Log azioni di moderazione\n' +
                '✅ Sistema di appelli\n\n' +
                'Seleziona cosa vuoi configurare:')
            .addFields(
                {
                    name: '📝 Stato Attuale',
                    value: '```\nAuto-mod: Disabilitato\nFiltro Parole: Non configurato\nLog Canale: Non configurato\n```',
                    inline: false
                }
            )
            .setFooter({
                text: `Configurazione richiesta da ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('moderation_config_option')
            .setPlaceholder('🔧 Seleziona un\'opzione da configurare')
            .addOptions(
                {
                    label: 'Auto-Moderazione',
                    description: 'Abilita sistema anti-spam e flood',
                    value: 'moderation_automod',
                    emoji: '🤖'
                },
                {
                    label: 'Filtro Parole',
                    description: 'Configura il filtro parole proibite',
                    value: 'moderation_wordfilter',
                    emoji: '🚫'
                },
                {
                    label: 'Canale Log',
                    description: 'Imposta canale per i log di moderazione',
                    value: 'moderation_log_channel',
                    emoji: '📝'
                },
                {
                    label: 'Sistema Warn',
                    description: 'Configura sistema avvertimenti progressivi',
                    value: 'moderation_warn_system',
                    emoji: '⚠️'
                }
            );

        const channelSelect = new ChannelSelectMenuBuilder()
            .setCustomId('moderation_log_select')
            .setPlaceholder('📍 Seleziona il canale log moderazione')
            .addChannelTypes(ChannelType.GuildText);

        const backButton = new ButtonBuilder()
            .setCustomId('setbot_back')
            .setLabel('Torna Indietro')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('⬅️');

        const row1 = new ActionRowBuilder().addComponents(selectMenu);
        const row2 = new ActionRowBuilder().addComponents(channelSelect);
        const row3 = new ActionRowBuilder().addComponents(backButton);

        await interaction.update({
            embeds: [embed],
            components: [row1, row2, row3],
            ephemeral: true
        });
    }
};
