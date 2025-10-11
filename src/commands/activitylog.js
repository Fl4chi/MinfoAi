const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { logActivity, readActivities, clearLog, getStats } = require('../logs/activityLog');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('activitylog')
        .setDescription('Visualizza e gestisci il registro attività del bot (solo owner)')
        .addSubcommand(subcommand =>
            subcommand
                .setName('view')
                .setDescription('Visualizza le ultime attività registrate')
                .addIntegerOption(option =>
                    option
                        .setName('limit')
                        .setDescription('Numero di attività da visualizzare (default: 20, max: 100)')
                        .setMinValue(1)
                        .setMaxValue(100)
                        .setRequired(false)
                )
                .addStringOption(option =>
                    option
                        .setName('type')
                        .setDescription('Filtra per tipo di attività')
                        .addChoices(
                            { name: 'Comandi', value: 'command' },
                            { name: 'Eventi', value: 'event' },
                            { name: 'Errori', value: 'error' },
                            { name: 'Sistema', value: 'system' }
                        )
                        .setRequired(false)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('Visualizza statistiche sulle attività')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('clear')
                .setDescription('Cancella il log delle attività (crea un backup)')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        try {
            // Verifica che l'utente sia l'owner del bot
            const isOwner = await checkBotOwner(interaction);
            if (!isOwner) {
                return interaction.reply({
                    content: '❌ **Accesso negato**: Solo il proprietario del bot può usare questo comando.',
                    ephemeral: true
                });
            }

            const subcommand = interaction.options.getSubcommand();

            if (subcommand === 'view') {
                await handleViewLogs(interaction);
            } else if (subcommand === 'stats') {
                await handleStats(interaction);
            } else if (subcommand === 'clear') {
                await handleClearLogs(interaction);
            }

            // Logga l'uso del comando
            logActivity('command', 'activitylog', {
                userId: interaction.user.id,
                username: interaction.user.tag,
                guildId: interaction.guildId,
                subcommand
            });

        } catch (error) {
            console.error('[ActivityLog Command] Errore:', error);
            
            logActivity('error', 'activitylog_command_error', {
                userId: interaction.user.id,
                error: error.message,
                stack: error.stack
            });

            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Si è verificato un errore durante l\'esecuzione del comando.',
                    ephemeral: true
                });
            }
        }
    }
};

/**
 * Verifica se l'utente è il proprietario del bot
 */
async function checkBotOwner(interaction) {
    try {
        // Ottieni l'applicazione del bot per verificare l'owner
        const application = await interaction.client.application.fetch();
        
        // Verifica se l'utente è l'owner
        if (application.owner) {
            // Se è un owner singolo
            if (application.owner.id === interaction.user.id) {
                return true;
            }
        }

        // Verifica se l'utente è membro del team owner
        if (application.owner?.members) {
            return application.owner.members.has(interaction.user.id);
        }

        return false;
    } catch (error) {
        console.error('[ActivityLog] Errore durante la verifica dell\'owner:', error);
        return false;
    }
}

/**
 * Gestisce la visualizzazione dei log
 */
async function handleViewLogs(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const limit = interaction.options.getInteger('limit') || 20;
    const type = interaction.options.getString('type');

    const activities = readActivities(limit, type);

    if (activities.length === 0) {
        return interaction.editReply({
            content: '📄 Nessuna attività trovata nel registro.',
            ephemeral: true
        });
    }

    // Crea gli embed per le attività
    const embed = new EmbedBuilder()
        .setTitle('📋 Registro Attività Bot')
        .setColor('#3498db')
        .setTimestamp();

    if (type) {
        embed.setDescription(`Filtro: **${getTypeLabel(type)}**`);
    }

    // Aggiungi le attività come campi
    const activityFields = activities.slice(-10).reverse().map((activity, index) => {
        const timestamp = new Date(activity.timestamp).toLocaleString('it-IT');
        const typeEmoji = getTypeEmoji(activity.type);
        
        return {
            name: `${typeEmoji} ${activity.action}`,
            value: `**Utente**: ${activity.user}\n**Guild**: ${activity.guild}\n**Data**: ${timestamp}\n**Dettagli**: \`${JSON.stringify(activity.details).substring(0, 100)}...\``,
            inline: false
        };
    });

    if (activityFields.length > 0) {
        embed.addFields(activityFields);
    }

    embed.setFooter({ text: `Totale attività: ${activities.length} | Mostrando le ultime ${Math.min(10, activities.length)}` });

    await interaction.editReply({ embeds: [embed], ephemeral: true });
}

/**
 * Gestisce la visualizzazione delle statistiche
 */
async function handleStats(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const stats = getStats();

    const embed = new EmbedBuilder()
        .setTitle('📈 Statistiche Attività Bot')
        .setColor('#2ecc71')
        .setTimestamp();

    embed.addFields(
        { name: '📊 Totale Attività', value: `${stats.total}`, inline: true },
        { name: '\u200b', value: '\u200b', inline: true },
        { name: '\u200b', value: '\u200b', inline: true }
    );

    // Aggiungi statistiche per tipo
    if (Object.keys(stats.byType).length > 0) {
        const typeStats = Object.entries(stats.byType)
            .map(([type, count]) => `${getTypeEmoji(type)} **${getTypeLabel(type)}**: ${count}`)
            .join('\n');
        
        embed.addFields({ name: '📊 Attività per Tipo', value: typeStats, inline: false });
    }

    // Ultima attività
    if (stats.lastActivity) {
        const lastTime = new Date(stats.lastActivity.timestamp).toLocaleString('it-IT');
        embed.addFields({
            name: '⏰ Ultima Attività',
            value: `**${stats.lastActivity.action}** - ${lastTime}`,
            inline: false
        });
    }

    // Prima attività
    if (stats.firstActivity) {
        const firstTime = new Date(stats.firstActivity.timestamp).toLocaleString('it-IT');
        embed.addFields({
            name: '📅 Prima Attività Registrata',
            value: `**${stats.firstActivity.action}** - ${firstTime}`,
            inline: false
        });
    }

    await interaction.editReply({ embeds: [embed], ephemeral: true });
}

/**
 * Gestisce la cancellazione dei log
 */
async function handleClearLogs(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const success = clearLog(true);

    if (success) {
        const embed = new EmbedBuilder()
            .setTitle('✅ Log Cancellato')
            .setDescription('Il registro attività è stato cancellato con successo.\nUn backup è stato creato automaticamente.')
            .setColor('#2ecc71')
            .setTimestamp();

        await interaction.editReply({ embeds: [embed], ephemeral: true });

        logActivity('system', 'activitylog_cleared', {
            userId: interaction.user.id,
            username: interaction.user.tag
        });
    } else {
        await interaction.editReply({
            content: '❌ Errore durante la cancellazione del log.',
            ephemeral: true
        });
    }
}

/**
 * Ottiene l'emoji per il tipo di attività
 */
function getTypeEmoji(type) {
    const emojis = {
        'command': '⚙️',
        'event': '🔔',
        'error': '❌',
        'system': '💻',
        'default': '📝'
    };
    return emojis[type] || emojis.default;
}

/**
 * Ottiene l'etichetta per il tipo di attività
 */
function getTypeLabel(type) {
    const labels = {
        'command': 'Comandi',
        'event': 'Eventi',
        'error': 'Errori',
        'system': 'Sistema'
    };
    return labels[type] || type;
}
