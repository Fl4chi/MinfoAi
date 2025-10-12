const { EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, RoleSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../database/models/GuildConfig');

module.exports = {
    customId: 'giveaway',
    
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
            const giveawayConfig = config.giveaway || {};
            
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
                        value: `\`\`\`\n` +
                            `Canale: ${giveawayConfig.channelId ? `<#${giveawayConfig.channelId}>` : 'Non configurato'}\n` +
                            `Ruolo Ping: ${giveawayConfig.pingRoleId ? `<@&${giveawayConfig.pingRoleId}>` : 'Non configurato'}\n` +
                            `Durata Default: ${giveawayConfig.defaultDuration || '7d'}\n` +
                            `Requisito Livello: ${giveawayConfig.minLevel || 'Nessuno'}\n` +
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
                        label: 'Durata Default',
                        description: 'Imposta durata predefinita giveaway',
                        value: 'giveaway_duration',
                        emoji: '⏰'
                    },
                    {
                        label: 'Giveaway Attivi',
                        description: 'Visualizza e gestisci giveaway in corso',
                        value: 'giveaway_list',
                        emoji: '📋'
                    }
                );

            const backButton = new ButtonBuilder()
                .setCustomId('setbot_back')
                .setLabel('Torna Indietro')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⬅️');

            const previewButton = new ButtonBuilder()
                .setCustomId('giveaway_preview')
                .setLabel('Anteprima Giveaway')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('👁️')
                .setDisabled(!giveawayConfig.channelId);

            const row1 = new ActionRowBuilder().addComponents(selectMenu);
            const row2 = new ActionRowBuilder().addComponents(previewButton, backButton);

            await interaction.update({
                embeds: [embed],
                components: [row1, row2],
                ephemeral: true
            });
        } catch (error) {
            console.error('Errore giveaway config:', error);
            await interaction.reply({
                content: '❌ Errore nel caricamento configurazione giveaway.',
                ephemeral: true
            });
        }
    }
};
