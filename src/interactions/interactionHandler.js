const fs = require('fs');
const path = require('path');

// Map per storare tutti gli interaction handlers
const interactionHandlers = new Map();

/**
 * Carica tutti gli interaction handlers dalla directory setbot
 */
function loadSetbotHandlers() {
    const setbotPath = path.join(__dirname, 'setbot');
    
    if (!fs.existsSync(setbotPath)) {
        console.log('⚠️ Directory setbot non trovata');
        return;
    }

    const handlerFiles = fs.readdirSync(setbotPath).filter(file => file.endsWith('.js'));

    for (const file of handlerFiles) {
        try {
            const handler = require(path.join(setbotPath, file));
            if (handler.customId && typeof handler.execute === 'function') {
                interactionHandlers.set(handler.customId, handler);
                console.log(`✅ Caricato handler: ${handler.customId}`);
            }
        } catch (error) {
            console.error(`❌ Errore caricando ${file}:`, error);
        }
    }
}

/**
 * Gestisce le interazioni (SelectMenu, Button, ecc.)
 */
async function handleInteraction(interaction) {
    try {
        // Gestione SelectMenu per home_module_select (dalla dashboard home)
        if (interaction.isStringSelectMenu() && interaction.customId === 'home_module_select') {
            const selectedModule = interaction.values[0];
            
            // Carica il modulo selezionato dinamicamente
            try {
                const moduleHandler = require(path.join(__dirname, 'setbot', `${selectedModule}.js`));
                if (moduleHandler && typeof moduleHandler.execute === 'function') {
                    await moduleHandler.execute(interaction);
                } else {
                    await interaction.reply({
                        content: `❌ Il modulo **${selectedModule}** non ha un metodo execute valido.`,
                        ephemeral: true
                    });
                }
            } catch (error) {
                console.error(`Errore nel caricamento del modulo ${selectedModule}:`, error);
                await interaction.reply({
                    content: `❌ Impossibile caricare il modulo **${selectedModule}**. Riprova più tardi.`,
                    ephemeral: true
                });
            }
            return;
        }

        // Gestione dei pulsanti rapidi dalla home
        if (interaction.isButton() && interaction.customId.startsWith('home_quick_')) {
            const action = interaction.customId.replace('home_quick_', '');
            
            try {
                const moduleHandler = require(path.join(__dirname, 'setbot', `${action}.js`));
                if (moduleHandler && typeof moduleHandler.execute === 'function') {
                    await moduleHandler.execute(interaction);
                } else {
                    await interaction.reply({
                        content: `❌ Il modulo **${action}** non è disponibile.`,
                        ephemeral: true
                    });
                }
            } catch (error) {
                console.error(`Errore nell'azione rapida ${action}:`, error);
                await interaction.reply({
                    content: `❌ Impossibile eseguire l'azione rapida.`,
                    ephemeral: true
                });
            }
            return;
        }

        // Gestione del pulsante help dalla home
        if (interaction.isButton() && interaction.customId === 'home_help') {
            const { EmbedBuilder } = require('discord.js');
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
            return;
        }

        // Gestione SelectMenu per setbot_category (compatibilità con vecchi handler)
        if (interaction.isStringSelectMenu() && interaction.customId === 'setbot_category') {
            const selectedCategory = interaction.values[0];
            const handler = interactionHandlers.get(selectedCategory);
            
            if (handler) {
                await handler.execute(interaction);
            } else {
                await interaction.reply({
                    content: '❌ Handler non trovato per questa categoria!',
                    ephemeral: true
                });
            }
            return;
        }

        // Gestione bottone "Torna Indietro" (torna alla home dashboard)
        if (interaction.isButton() && interaction.customId === 'setbot_back') {
            const homeHandler = require('./setbot/home');
            await homeHandler.execute(interaction);
            return;
        }

        // Gestione bottone refresh
        if (interaction.isButton() && interaction.customId === 'setbot_refresh') {
            const homeHandler = require('./setbot/home');
            await homeHandler.execute(interaction);
            return;
        }

        // Gestione bottone help (per compatibilità)
        if (interaction.isButton() && interaction.customId === 'setbot_help') {
            const { EmbedBuilder } = require('discord.js');
            const helpEmbed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('❓ Guida Dashboard')
                .setDescription('**Come utilizzare la dashboard:**\n\n' +
                    '1️⃣ Seleziona una categoria dal menu\n' +
                    '2️⃣ Configura le impostazioni desiderate\n' +
                    '3️⃣ Usa il bottone "Torna Indietro" per tornare al menu principale\n\n' +
                    '**Variabili disponibili nei messaggi:**\n' +
                    '`{user}` - Menziona l\'utente\n' +
                    '`{username}` - Nome utente\n' +
                    '`{server}` - Nome del server\n' +
                    '`{memberCount}` - Numero membri totali')
                .setFooter({ text: 'MinfoAi Dashboard', iconURL: interaction.client.user.displayAvatarURL() });

            await interaction.reply({
                embeds: [helpEmbed],
                ephemeral: true
            });
            return;
        }
    } catch (error) {
        console.error('❌ Errore gestendo interazione:', error);
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ Si è verificato un errore durante l\'elaborazione dell\'interazione.',
                ephemeral: true
            });
        }
    }
}

// Carica gli handlers all'avvio
loadSetbotHandlers();

module.exports = {
    handleInteraction,
    loadSetbotHandlers
};
