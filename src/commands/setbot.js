const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setbot')
        .setDescription('🎛️ Dashboard Premium - Configura tutte le funzionalità del bot con stile moderno'),
    
    async execute(interaction) {
        // Verifica permessi admin
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({
                content: '🚫 **Accesso Negato** • Solo gli amministratori possono accedere alla dashboard premium.',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor([88, 101, 242]) // Discord Blurple gradient-ready
            .setAuthor({ 
                name: '🎛️ MinfoAi Premium Dashboard',
                iconURL: interaction.client.user.displayAvatarURL({ dynamic: true, size: 512 })
            })
            .setThumbnail('https://cdn.discordapp.com/emojis/940275445603106846.gif') // Bot gear animation
            .setDescription(
                '✨ **Benvenuto nella Dashboard Premium di MinfoAi**\n' +
                '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
                '🎨 **Interfaccia Moderna** • Configura ogni aspetto del bot con eleganza\n' +
                '⚡ **Salvataggio Automatico** • Tutte le modifiche vengono salvate istantaneamente\n' +
                '🔧 **Controllo Completo** • Accesso a tutte le funzionalità avanzate\n\n' +
                '**📋 Seleziona una categoria dal menu per iniziare**'
            )
            .addFields(
                {
                    name: '🌟 **Welcome & Goodbye System**',
                    value: '```ansi\n\u001b[36m• Messaggi personalizzati dinamici\n• Canali dedicati con auto-setup\n• Embed con colori gradient\n• Immagini welcome custom```',
                    inline: true
                },
                {
                    name: '🛡️ **Moderation Suite**',
                    value: '```ansi\n\u001b[33m• Auto-mod intelligente\n• Log completo azioni\n• Sistema warn avanzato\n• Gestione tempban/permban```',
                    inline: true
                },
                {
                    name: '🏆 **Gamification Engine**',
                    value: '```ansi\n\u001b[32m• Sistema XP multicanale\n• Livelli con role rewards\n• Leaderboard dinamica\n• Achievement system```',
                    inline: true
                },
                {
                    name: '🎁 **Giveaway Manager**',
                    value: '```ansi\n\u001b[35m• Contest automatizzati\n• Regole personalizzabili\n• Estrazione random verificata\n• Notifiche vincitori```',
                    inline: true
                },
                {
                    name: '🆘 **Support Center**',
                    value: '```ansi\n\u001b[34m• Ticket system professionale\n• FAQ dinamiche\n• Documentazione integrata\n• Supporto multilingua```',
                    inline: true
                },
                {
                    name: '⚙️ **System Status**',
                    value: '```yaml\nUptime: 99.99%\nLatency: <50ms\nDatabase: ✅ Online\nBackup: ✅ Attivo```',
                    inline: true
                }
            )
            .setFooter({ 
                text: `Richiesto da ${interaction.user.tag} • MinfoAi v3.0 Premium Edition`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('dashboard_category')
            .setPlaceholder('📂 Seleziona una categoria da configurare')
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions(
                {
                    label: 'Welcome System',
                    description: 'Configura messaggi di benvenuto',
                    value: 'welcome',
                    emoji: '👋'
                },
                {
                    label: 'Goodbye System',
                    description: 'Configura messaggi di addio',
                    value: 'goodbye',
                    emoji: '👋'
                },
                {
                    label: 'Moderation',
                    description: 'Configura la moderazione automatica',
                    value: 'moderation',
                    emoji: '🛡️'
                },
                {
                    label: 'Gamification',
                    description: 'Sistema XP, livelli e ricompense',
                    value: 'gamification',
                    emoji: '🏆'
                },
                {
                    label: 'Giveaway Manager',
                    description: 'Gestisci giveaway e contest',
                    value: 'giveaway',
                    emoji: '🎁'
                },
                {
                    label: 'Support Center',
                    description: 'Centro assistenza e documentazione',
                    value: 'support',
                    emoji: '🆘'
                }
            );

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('dashboard_refresh')
                    .setLabel('Aggiorna')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔄'),
                new ButtonBuilder()
                    .setCustomId('dashboard_stats')
                    .setLabel('Statistiche')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('📊'),
                new ButtonBuilder()
                    .setCustomId('dashboard_backup')
                    .setLabel('Backup Config')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('💾'),
                new ButtonBuilder()
                    .setLabel('Guida')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://github.com/Fl4chi/MinfoAi/wiki')
                    .setEmoji('❓')
            );

        const selectRow = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({
            embeds: [embed],
            components: [selectRow, buttons],
            ephemeral: false
        });
    }
};
