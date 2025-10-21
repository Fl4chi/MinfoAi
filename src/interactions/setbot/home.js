const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'setbot',
        description: '🏠 Dashboard principale - Configurazione completa di tutte le funzionalità del bot'
    },

    async execute(interaction) {
        try {
            // Embed principale della dashboard con UI semplice e chiara
            const homeEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🤖 MinfoAi - Dashboard Configurazione')
                .setDescription(
                    "Seleziona una delle funzionalità disponibili per configurare il tuo server Discord. Ogni modulo offre un'ampia personalizzazione per adattarsi alle tue esigenze."
                )
                .addFields(
                    {
                        name: '👋 Gestione Benvenuto',
                        value: 'Imposta messaggi e canali di benvenuto con opzioni semplici e chiare.',
                        inline: true
                    },
                    {
                        name: '👋 Gestione Goodbye',
                        value: 'Configura messaggi di addio essenziali per chi lascia il server.',
                        inline: true
                    },
                    {
                        name: '🛡️ Moderazione',
                        value: 'Regole base, automod essenziale e azioni rapide per mantenere l’ordine.',
                        inline: true
                    },
                    {
                        name: '✅ Verifica',
                        value: 'Abilita una semplice verifica utenti con ruolo dedicato.',
                        inline: true
                    },
                    {
                        name: '🎵 Musica',
                        value: 'Player facile: play, pausa, skip e gestione coda.',
                        inline: true
                    },
                    {
                        name: '🏆 Gamification',
                        value: 'XP, livelli e premi base per coinvolgere la community.',
                        inline: true
                    }
                )
                .setFooter({ text: '💡 Usa il menu sottostante per scegliere il modulo da configurare' })
                .setTimestamp();

            // Menu di selezione modulare (lasciato invariato per semplicità di navigazione)
            const moduleMenu = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('home_module_select')
                        .setPlaceholder('📋 Scegli il modulo da configurare')
                        .addOptions([
                            {
                                label: '👋 Gestione Benvenuto',
                                description: 'Configura il benvenuto',
                                value: 'welcome',
                                emoji: '👋'
                            },
                            {
                                label: '👋 Gestione Goodbye',
                                description: 'Configura i messaggi di addio',
                                value: 'goodbye',
                                emoji: '👋'
                            },
                            {
                                label: '🛡️ Moderazione',
                                description: 'Automod e azioni rapide',
                                value: 'moderation',
                                emoji: '🛡️'
                            },
                            {
                                label: '✅ Verifica',
                                description: 'Verifica utenti semplice',
                                value: 'verification',
                                emoji: '✅'
                            },
                            {
                                label: '🎵 Musica',
                                description: 'Player e coda',
                                value: 'music',
                                emoji: '🎵'
                            },
                            {
                                label: '🏆 Gamification',
                                description: 'XP e livelli',
                                value: 'gamification',
                                emoji: '🏆'
                            }
                        ])
                );

            // Invia o aggiorna il messaggio della dashboard
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({
                    embeds: [homeEmbed],
                    components: [moduleMenu]
                });
            } else {
                await interaction.reply({
                    embeds: [homeEmbed],
                    components: [moduleMenu],
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Errore in home.js:', error);
            const errorMessage = {
                content: '❌ Si è verificato un errore durante l\'apertura della dashboard. Riprova più tardi.',
                ephemeral: true
            };

            if (interaction.replied || interaction.deferred) {
                await interaction.editReply(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    },

    // Handler per le interazioni del select menu
    async handleModuleSelect(interaction) {
        const selectedModule = interaction.values[0];

        // Carica dinamicamente il modulo selezionato
        try {
            const module = require(`./${selectedModule}.js`);
            await module.execute(interaction);
        } catch (error) {
            console.error(`Errore nel caricamento del modulo ${selectedModule}:`, error);
            await interaction.reply({
                content: `❌ Impossibile caricare il modulo **${selectedModule}**. Verifica che sia implementato correttamente.`,
                ephemeral: true
            });
        }
    }
};
