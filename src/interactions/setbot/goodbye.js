const { EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../database/models/GuildConfig');

module.exports = {
    customId: 'goodbye',
    
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
            const goodbyeConfig = config.goodbye || {};
            
            const embed = new EmbedBuilder()
                .setColor(goodbyeConfig.embedColor || '#FF4444')
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
                        value: `\`\`\`\n` +
                            `Stato: ${goodbyeConfig.enabled ? '✅ Abilitato' : '❌ Disabilitato'}\n` +
                            `Canale: ${goodbyeConfig.channelId ? `<#${goodbyeConfig.channelId}>` : 'Non configurato'}\n` +
                            `Messaggio: ${goodbyeConfig.message ? 'Configurato' : 'Default'}\n` +
                            `Statistiche: ${goodbyeConfig.showStats ? 'Abilitate' : 'Disabilitate'}\n` +
                            `Colore: ${goodbyeConfig.embedColor || '#FF4444'}\n` +
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
                        label: 'Statistiche',
                        description: 'Mostra/nascondi statistiche membri',
                        value: 'goodbye_stats',
                        emoji: '📊'
                    },
                    {
                        label: 'Variabili Disponibili',
                        description: 'Mostra le variabili per messaggi personalizzati',
                        value: 'goodbye_variables',
                        emoji: '📌'
                    }
                );

            const toggleButton = new ButtonBuilder()
                .setCustomId('goodbye_toggle')
                .setLabel(goodbyeConfig.enabled ? 'Disabilita' : 'Abilita')
                .setStyle(goodbyeConfig.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
                .setEmoji(goodbyeConfig.enabled ? '❌' : '✅');

            const backButton = new ButtonBuilder()
                .setCustomId('setbot_back')
                .setLabel('Torna Indietro')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⬅️');

            const previewButton = new ButtonBuilder()
                .setCustomId('goodbye_preview')
                .setLabel('Anteprima Live')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('👁️')
                .setDisabled(!goodbyeConfig.channelId);

            const row1 = new ActionRowBuilder().addComponents(selectMenu);
            const row2 = new ActionRowBuilder().addComponents(toggleButton, previewButton, backButton);

            await interaction.update({
                embeds: [embed],
                components: [row1, row2],
                ephemeral: true
            });
        } catch (error) {
            console.error('Errore goodbye config:', error);
            await interaction.reply({
                content: '❌ Errore nel caricamento configurazione addio.',
                ephemeral: true
            });
        }
    }
};
