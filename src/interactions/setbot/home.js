const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder } = require('discord.js');
module.exports = {
    data: {
        name: 'setbot',
        description: '🏠 Dashboard principale del bot - Gestisci tutte le funzionalità'
    },
    async execute(interaction) {
        try {
            // Crea l'embed principale con lo stile Discord Ticket
            const homeEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🤖 MinfoAi Dashboard')
                .setDescription(
                    '**Benvenuto nel pannello di controllo di MinfoAi!**\n\n' +
                    'Seleziona una delle funzionalità disponibili per configurare il tuo server Discord.\n' +
                    'Ogni modulo offre un\'ampia personalizzazione per adattarsi alle tue esigenze.'
                )
                .addFields(
                    {
                        name: '👋 Gestione Benvenuto',
                        value: 'Configura messaggi di benvenuto personalizzati con embed, immagini e testo dinamico per accogliere i nuovi membri.',
                        inline: true
                    },
                    {
                        name: '🚪 Gestione Goodbye',
                        value: 'Imposta messaggi di addio personalizzati quando un utente lascia il server, con embed e stile dedicato.',
                        inline: true
                    },
                    {
                        name: '🛡️ Moderazione',
                        value: 'Sistema completo di moderazione con log avanzati, automod, warning e gestione sanzioni automatizzate.',
                        inline: true
                    },
                    {
                        name: '✅ Verifica',
                        value: 'Sistema di verifica utenti con captcha, pulsanti di verifica e assegnazione automatica dei ruoli verificati.',
                        inline: true
                    },
                    {
                        name: '🎉 Giveaway',
                        value: 'Crea e gestisci giveaway con timer, requisiti personalizzati, embed accattivanti e estrazione automatica.',
                        inline: true
                    },
                    {
                        name: '🎵 Musica',
                        value: 'Player musicale avanzato con playlist, coda, filtri audio, equalizzatore e controllo completo della riproduzione.',
                        inline: true
                    },
                    {
                        name: '🏆 Gamification',
                        value: 'Sistema di livelli, XP, classifica, badge e ricompense per aumentare l\'engagement della community.',
                        inline: true
                    }
                )
                .setFooter({ text: 'Seleziona un modulo dal menu per iniziare' })
                .setTimestamp();
            // Menu di selezione per navigare tra i moduli
            const moduleMenu = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('home_module_select')
                        .setPlaceholder('📋 Seleziona un modulo da configurare')
                        .addOptions([
                            {
                                label: 'Gestione Benvenuto',
                                description: 'Configura i messaggi di benvenuto',
                                value: 'welcome',
                                emoji: '👋'
                            },
                            {
                                label: 'Gestione Goodbye',
                                description: 'Configura i messaggi di addio',
                                value: 'goodbye',
                                emoji: '🚪'
                            },
                            {
                                label: 'Sistema Moderazione',
                                description: 'Configura le regole di moderazione',
                                value: 'moderation',
                                emoji: '🛡️'
                            },
                            {
                                label: 'Sistema Verifica',
                                description: 'Configura il sistema di verifica utenti',
                                value: 'verification',
                                emoji: '✅'
                            },
                            {
                                label: 'Dashboard Giveaway',
                                description: 'Crea e gestisci giveaway',
                                value: 'giveaway',
                                emoji: '🎉'
                            },
                            {
                                label: 'Player Musica',
                                description: 'Configura il sistema musicale',
                                value: 'music',
                                emoji: '🎵'
                            },
                            {
                                label: 'Sistema Gamification',
                                description: 'Configura livelli e ricompense',
                                value: 'gamification',
                                emoji: '🏆'
                            }
                        ])
                );
            // Invia o aggiorna il messaggio
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
                content: '❌ Si è verificato un errore durante l\'apertura della dashboard.',
                ephemeral: true
            };
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply(errorMessage);
            } else {
                await interaction.reply(errorMessage);
            }
        }
    },
    // Handler per le interazioni del menu
    async handleModuleSelect(interaction) {
        const selectedModule = interaction.values[0];
        
        // Carica il modulo selezionato
        try {
            const module = require(`./${selectedModule}.js`);
            await module.execute(interaction);
        } catch (error) {
            console.error(`Errore nel caricamento del modulo ${selectedModule}:`, error);
            await interaction.reply({
                content: `❌ Impossibile caricare il modulo **${selectedModule}**. Riprova più tardi.`,
                ephemeral: true
            });
        }
    }
};
