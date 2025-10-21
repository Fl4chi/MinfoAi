const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'setbot',
        description: '🏠 Dashboard principale - Configurazione completa di tutte le funzionalità del bot'
    },
    async execute(interaction) {
        try {
            // Crea l'embed principale della dashboard con struttura modulare
            const homeEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🤖 MinfoAi - Dashboard Configurazione')
                .setDescription(
                    '**Benvenuto nel pannello di controllo completo di MinfoAi!**\n\n' +
                    'Un bot Discord all-in-one con moderazione avanzata, AI proprietaria, gamification, musica, giveaway, verifica utenti e automazioni.\n' +
                    'Seleziona un modulo dal menu per configurare le funzionalità del tuo server.'
                )
                .addFields(
                    {
                        name: '👋 Welcome & Goodbye',
                        value: 'Messaggi personalizzati di benvenuto e addio con embed, immagini dinamiche, banner e placeholder avanzati.',
                        inline: true
                    },
                    {
                        name: '🛡️ Moderazione',
                        value: 'Sistema completo: ban, kick, mute, timeout, warn, automod (anti-spam, anti-link, filtri), case system e log.',
                        inline: true
                    },
                    {
                        name: '✅ Verifica Utenti',
                        value: 'Sistema di verifica con captcha, quiz, ruolo verificato, DM onboarding e gestione scadenze automatica.',
                        inline: true
                    },
                    {
                        name: '🏆 XP & Leveling',
                        value: 'Sistema gamification con XP per messaggi/voice, livelli, leaderboard paginata, premi ruolo automatici.',
                        inline: true
                    },
                    {
                        name: '🎉 Giveaway',
                        value: 'Creazione giveaway con durata, vincitori multipli, requisiti ruolo, reroll, annunci automatici e storico.',
                        inline: true
                    },
                    {
                        name: '🎵 Musica',
                        value: 'Player avanzato: play/queue/skip/loop, supporto YouTube/Spotify, filtri audio, playlist server salvate.',
                        inline: true
                    },
                    {
                        name: '🤖 Moduli AI',
                        value: 'AI avanzata: /ask, /summarize, /translate, /image, /tts con OpenAI, ElevenLabs e moderazione assistita.',
                        inline: true
                    },
                    {
                        name: '⚙️ Automazioni',
                        value: 'Ruoli auto su join, messaggi ricorrenti (scheduler), backup/esportazione config, azioni automatizzate.',
                        inline: true
                    },
                    {
                        name: '📊 Info & Utility',
                        value: 'Comandi info (server, user, role, bot), poll, reminders, afk, role menus, reaction roles e utilità varie.',
                        inline: true
                    }
                )
                .setFooter({ text: '💡 Seleziona un modulo dal menu sottostante per iniziare la configurazione' })
                .setTimestamp();

            // Menu di selezione modulare per navigare tra tutte le funzionalità
            const moduleMenu = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('home_module_select')
                        .setPlaceholder('📋 Scegli il modulo da configurare')
                        .addOptions([
                            {
                                label: '👋 Welcome & Goodbye',
                                description: 'Messaggi di benvenuto e addio personalizzati',
                                value: 'welcome',
                                emoji: '👋'
                            },
                            {
                                label: '🛡️ Sistema Moderazione',
                                description: 'Automod, ban, warn, filtri e log avanzati',
                                value: 'moderation',
                                emoji: '🛡️'
                            },
                            {
                                label: '✅ Verifica Utenti',
                                description: 'Captcha, ruoli verificati e onboarding',
                                value: 'verification',
                                emoji: '✅'
                            },
                            {
                                label: '🏆 XP & Gamification',
                                description: 'Livelli, XP, leaderboard e premi automatici',
                                value: 'gamification',
                                emoji: '🏆'
                            },
                            {
                                label: '🎉 Giveaway',
                                description: 'Crea e gestisci giveaway con requisiti',
                                value: 'giveaway',
                                emoji: '🎉'
                            },
                            {
                                label: '🎵 Player Musica',
                                description: 'YouTube, Spotify, playlist e controlli audio',
                                value: 'music',
                                emoji: '🎵'
                            },
                            {
                                label: '🤖 Moduli AI',
                                description: 'Ask, summarize, translate, image, tts',
                                value: 'ai',
                                emoji: '🤖'
                            },
                            {
                                label: '⚙️ Automazioni',
                                description: 'Ruoli auto, messaggi ricorrenti, backup',
                                value: 'automations',
                                emoji: '⚙️'
                            },
                            {
                                label: '📊 Info & Utility',
                                description: 'Comandi info, poll, reminders, role menus',
                                value: 'info',
                                emoji: '📊'
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
