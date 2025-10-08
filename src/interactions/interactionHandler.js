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
        // Gestione SelectMenu per setbot_category
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

        // Gestione bottone "Torna Indietro"
        if (interaction.isButton() && interaction.customId === 'setbot_back') {
            const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
            
            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('🎛️ Dashboard Configurazione Bot')
                .setDescription('Benvenuto nella dashboard interattiva di **MinfoAi**!\n\n' +
                    'Seleziona la categoria che desideri configurare dal menu sottostante.\n' +
                    'Tutte le modifiche saranno salvate automaticamente nel database.')
                .addFields(
                    { name: '👋 Benvenuti', value: 'Configura messaggi di benvenuto personalizzati', inline: true },
                    { name: '👋 Addii', value: 'Configura messaggi di addio per i membri', inline: true },
                    { name: '🎵 Musica', value: 'Imposta canali e permessi musicali', inline: true },
                    { name: '🛡️ Moderazione', value: 'Sistema di moderazione e auto-mod', inline: true },
                    { name: '🎮 Gamification', value: 'Livelli, XP e reward per membri attivi', inline: true },
                    { name: '🎁 Giveaway', value: 'Gestione giveaway e premi', inline: true }
                )
                .setFooter({ text: `Richiesto da ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
                .setTimestamp();

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('setbot_category')
                .setPlaceholder('🔧 Seleziona una categoria da configurare')
                .addOptions(
                    { label: 'Benvenuti', description: 'Configura i messaggi di benvenuto', value: 'welcome', emoji: '👋' },
                    { label: 'Addii', description: 'Configura i messaggi di addio', value: 'goodbye', emoji: '👋' },
                    { label: 'Musica', description: 'Imposta le impostazioni musicali', value: 'music', emoji: '🎵' },
                    { label: 'Moderazione', description: 'Sistema di moderazione automatica', value: 'moderation', emoji: '🛡️' },
                    { label: 'Gamification', description: 'Sistema livelli e XP', value: 'gamification', emoji: '🎮' },
                    { label: 'Giveaway', description: 'Gestisci giveaway e premi', value: 'giveaway', emoji: '🎁' }
                );

            const refreshButton = new ButtonBuilder()
                .setCustomId('setbot_refresh')
                .setLabel('Aggiorna Dashboard')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('🔄');

            const helpButton = new ButtonBuilder()
                .setCustomId('setbot_help')
                .setLabel('Aiuto')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('❓');

            const row1 = new ActionRowBuilder().addComponents(selectMenu);
            const row2 = new ActionRowBuilder().addComponents(refreshButton, helpButton);

            await interaction.update({
                embeds: [embed],
                components: [row1, row2],
                ephemeral: true
            });
            return;
        }

        // Gestione bottone refresh
        if (interaction.isButton() && interaction.customId === 'setbot_refresh') {
            await interaction.reply({
                content: '🔄 Dashboard aggiornata!',
                ephemeral: true
            });
            return;
        }

        // Gestione bottone help
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
