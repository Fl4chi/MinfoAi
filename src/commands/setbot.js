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
                    name: '🎵 **Advanced Music System**',
                    value: '```ansi\n\u001b[35m• Player con interfaccia touch\n• Queue management avanzato\n• Filters & effects premium\n• Multi-source support```',
                    inline: true
                },
                {
                    name: '🛡️ **Smart Moderation AI**',
                    value: '```ansi\n\u001b[31m• Auto-mod intelligente\n• Custom word filters\n• Behavior analysis\n• Real-time protection```',
                    inline: true
                },
                {
                    name: '🏆 **Gamification Engine**',
                    value: '```ansi\n\u001b[33m• XP system dinamico\n• Achievement unlocks\n• Custom leaderboards\n• Reward automation```',
                    inline: true
                },
                {
                    name: '🎁 **Giveaway Studio Pro**',
                    value: '```ansi\n\u001b[32m• Templates professionali\n• Multi-winner support\n• Requirement system\n• Analytics dashboard```',
                    inline: true
                },
                {
                    name: '🆘 **24/7 Support Hub**',
                    value: '```ansi\n\u001b[34m• Documentazione live\n• Video tutorials\n• Community support\n• Priority assistance```',
                    inline: true
                }
            )
            .setFooter({ 
                text: `🚀 Dashboard richiesta da ${interaction.user.globalName || interaction.user.username} • MinfoAi Premium v2.0`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('setbot_category')
            .setPlaceholder('🎯 Scegli una categoria da configurare...')
            .addOptions([
                {
                    label: 'Welcome & Goodbye',
                    description: 'Configura messaggi di benvenuto e addio',
                    value: 'welcome',
                    emoji: '🌟'
                },
                {
                    label: 'Music System',
                    description: 'Imposta il sistema musicale avanzato',
                    value: 'music',
                    emoji: '🎵'
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
            ]);

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
                    .setCustomId('dashboard_help')
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
