const { EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType } = require('discord.js');

module.exports = {
    customId: 'gamification',
    
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#F1C40F')
            .setTitle('🎮 Configurazione Gamification')
            .setDescription('Configura il sistema di livelli e XP per il tuo server!\n\n' +
                '**Funzionalità disponibili:**\n' +
                '✅ Sistema livelli con XP progressivi\n' +
                '✅ Ruoli reward automatici\n' +
                '✅ Leaderboard dinamica\n' +
                '✅ XP boost per canali specifici\n' +
                '✅ Moltiplicatori XP temporanei\n\n' +
                'Seleziona cosa vuoi configurare:')
            .addFields(
                {
                    name: '📝 Stato Attuale',
                    value: '```\nSistema XP: Disabilitato\nRuoli Reward: 0 configurati\nCanale Livelli: Non configurato\n```',
                    inline: false
                }
            )
            .setFooter({
                text: `Configurazione richiesta da ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('gamification_config_option')
            .setPlaceholder('🔧 Seleziona un\'opzione da configurare')
            .addOptions(
                {
                    label: 'Sistema XP',
                    description: 'Abilita/configura guadagno XP',
                    value: 'gamification_xp_system',
                    emoji: '⭐'
                },
                {
                    label: 'Ruoli Reward',
                    description: 'Imposta ruoli per ogni livello',
                    value: 'gamification_role_rewards',
                    emoji: '🎭'
                },
                {
                    label: 'Canale Annunci Livelli',
                    description: 'Dove notificare i level up',
                    value: 'gamification_level_channel',
                    emoji: '📝'
                },
                {
                    label: 'Boost XP',
                    description: 'Configura moltiplicatori XP',
                    value: 'gamification_xp_boost',
                    emoji: '🚀'
                },
                {
                    label: 'Leaderboard',
                    description: 'Personalizza la classifica',
                    value: 'gamification_leaderboard',
                    emoji: '🏆'
                }
            );

        const channelSelect = new ChannelSelectMenuBuilder()
            .setCustomId('gamification_channel_select')
            .setPlaceholder('📍 Seleziona il canale per i level up')
            .addChannelTypes(ChannelType.GuildText);

        const enableButton = new ButtonBuilder()
            .setCustomId('gamification_toggle')
            .setLabel('Abilita Gamification')
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
