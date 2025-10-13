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

            // Pulsanti rapidi per azioni comuni
            const quickActions = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('home_quick_welcome')
                        .setLabel('Setup Veloce Benvenuto')
                        .setStyle(ButtonStyle.Primary)
                        .setEmoji('⚡'),
                    new ButtonBuilder()
                        .setCustomId('home_quick_moderation')
                        .setLabel('Setup Veloce Moderazione')
                        .setStyle(ButtonStyle.Success)
                        .setEmoji('🛡️'),
                    new ButtonBuilder()
                        .setCustomId('home_help')
                        .setLabel('Guida')
                        .setStyle(ButtonStyle.Secondary)
                        .setEmoji('❓')
                );

            // Invia o aggiorna il messaggio
            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({
                    embeds: [homeEmbed],
                    components: [moduleMenu, quickActions]
                });
            } else {
                await interaction.reply({
                    embeds: [homeEmbed],
                    components: [moduleMenu, quickActions],
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
    },

    // Handler per i pulsanti rapidi
    async handleQuickAction(interaction, action) {
        try {
            if (action === 'quick_welcome') {
                const welcomeModule = require('./welcome.js');
                await welcomeModule.execute(interaction);
            } else if (action === 'quick_moderation') {
                const moderationModule = require('./moderation.js');
                await moderationModule.execute(interaction);
            } else if (action === 'help') {
                const helpEmbed = new EmbedBuilder()
                    .setColor('#5865F2')
                    .setTitle('📖 Guida MinfoAi Dashboard')
                    .setDescription(
                        '**Come utilizzare la dashboard:**\n\n' +
                        '1️⃣ Seleziona un modulo dal menu a tendina\n' +
                        '2️⃣ Configura le impostazioni tramite i pulsanti e modal\n' +
                        '3️⃣ Visualizza l\'anteprima live delle modifiche\n' +
                        '4️⃣ Salva le configurazioni quando sei soddisfatto\n\n' +
                        '**Setup Veloce:** Usa i pulsanti rapidi per configurazioni predefinite\n' +
                        '**Personalizzazione:** Ogni embed supporta colori, immagini, footer e molto altro\n' +
                        '**Supporto:** Per assistenza, contatta gli amministratori del server'
                    )
                    .addFields(
                        {
                            name: '💡 Suggerimenti',
                            value: '• Testa sempre le configurazioni prima di attivarle\n• Usa variabili dinamiche come {user}, {server}, {count}\n• Salva configurazioni multiple e scegli quella preferita',
                            inline: false
                        }
                    )
                    .setFooter({ text: 'MinfoAi Dashboard - Versione 2.0' })
                    .setTimestamp();

                await interaction.reply({
                    embeds: [helpEmbed],
                    ephemeral: true
                });
            }
        } catch (error) {
            console.error('Errore nell\'azione rapida:', error);
            await interaction.reply({
                content: '❌ Si è verificato un errore durante l\'esecuzione dell\'azione.',
                ephemeral: true
            });
        }
    }
};
