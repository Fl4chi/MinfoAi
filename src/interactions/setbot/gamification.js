const { EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, RoleSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../database/models/GuildConfig');

module.exports = {
    customId: 'gamification',
    
    async execute(interaction) {
        // Verifica permessi
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({
                content: '❌ Non hai i permessi necessari (Gestisci Server richiesto).',
                ephemeral: true
            });
        }

        try {
            // Carica config attuale
            const config = await GuildConfig.findOne({ guildId: interaction.guild.id }) || {};
            const gamificationConfig = config.gamification || {};
            
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
                        value: `\`\`\`\n` +
                            `Stato: ${gamificationConfig.enabled ? '✅ Abilitato' : '❌ Disabilitato'}\n` +
                            `XP per Messaggio: ${gamificationConfig.xpPerMessage || '10-20'}\n` +
                            `Ruoli Reward: ${gamificationConfig.roleRewards?.length || 0} configurati\n` +
                            `Canale Livelli: ${gamificationConfig.levelChannelId ? `<#${gamificationConfig.levelChannelId}>` : 'Non configurato'}\n` +
                            `XP Multiplier: ${gamificationConfig.xpMultiplier || 1}x\n` +
                            `Canali Boost: ${gamificationConfig.boostChannels?.length || 0}\n` +
                            `\`\`\``,
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
                        label: 'Canali Bonus',
                        description: 'Canali con XP maggiorato',
                        value: 'gamification_boost_channels',
                        emoji: '💯'
                    },
                    {
                        label: 'Leaderboard',
                        description: 'Personalizza la classifica',
                        value: 'gamification_leaderboard',
                        emoji: '🏆'
                    }
                );

            const toggleButton = new ButtonBuilder()
                .setCustomId('gamification_toggle')
                .setLabel(gamificationConfig.enabled ? 'Disabilita' : 'Abilita')
                .setStyle(gamificationConfig.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
                .setEmoji(gamificationConfig.enabled ? '❌' : '✅');

            const backButton = new ButtonBuilder()
                .setCustomId('setbot_back')
                .setLabel('Torna Indietro')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⬅️');

            const statsButton = new ButtonBuilder()
                .setCustomId('gamification_stats')
                .setLabel('Statistiche')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📊')
                .setDisabled(!gamificationConfig.enabled);

            const row1 = new ActionRowBuilder().addComponents(selectMenu);
            const row2 = new ActionRowBuilder().addComponents(toggleButton, statsButton, backButton);

            await interaction.update({
                embeds: [embed],
                components: [row1, row2],
                ephemeral: true
            });
        } catch (error) {
            console.error('Errore gamification config:', error);
            await interaction.reply({
                content: '❌ Errore nel caricamento configurazione gamification.',
                ephemeral: true
            });
        }
    }
};
