const { EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, RoleSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../database/models/GuildConfig');

module.exports = {
    customId: 'music',
    
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
            const musicConfig = config.music || {};
            
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
                        value: `\`\`\`\n` +
                            `Canale: ${musicConfig.channelId ? `<#${musicConfig.channelId}>` : 'Non configurato'}\n` +
                            `Volume: ${musicConfig.defaultVolume || 50}%\n` +
                            `Modo DJ: ${musicConfig.djMode ? 'Abilitato' : 'Disabilitato'}\n` +
                            `Ruolo DJ: ${musicConfig.djRoleId ? `<@&${musicConfig.djRoleId}>` : 'Non configurato'}\n` +
                            `Limite Coda: ${musicConfig.queueLimit || 'Illimitato'}\n` +
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
                        label: 'Ruolo DJ',
                        description: 'Seleziona il ruolo DJ per controllo musica',
                        value: 'music_dj_role',
                        emoji: '🎭'
                    },
                    {
                        label: 'Limiti Coda',
                        description: 'Imposta massimo canzoni per utente',
                        value: 'music_queue_limit',
                        emoji: '📋'
                    },
                    {
                        label: 'Filtri Audio',
                        description: 'Configura filtri audio disponibili',
                        value: 'music_filters',
                        emoji: '🎶'
                    }
                );

            const backButton = new ButtonBuilder()
                .setCustomId('setbot_back')
                .setLabel('Torna Indietro')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⬅️');

            const testButton = new ButtonBuilder()
                .setCustomId('music_test')
                .setLabel('Test Player')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('▶️')
                .setDisabled(!musicConfig.channelId);

            const row1 = new ActionRowBuilder().addComponents(selectMenu);
            const row2 = new ActionRowBuilder().addComponents(testButton, backButton);

            await interaction.update({
                embeds: [embed],
                components: [row1, row2],
                ephemeral: true
            });
        } catch (error) {
            console.error('Errore music config:', error);
            await interaction.reply({
                content: '❌ Errore nel caricamento configurazione musica.',
                ephemeral: true
            });
        }
    }
};
