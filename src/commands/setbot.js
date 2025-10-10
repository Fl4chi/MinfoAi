const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setbot')
        .setDescription('🎛️ Dashboard interattiva premium per configurare tutte le funzionalità del bot'),
    
    async execute(interaction) {
        // Verifica permessi admin
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({
                content: '❌ **Accesso Negato** • Solo gli amministratori possono accedere alla dashboard di configurazione.',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setAuthor({ 
                name: '🎛️ Dashboard Configurazione Bot',
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setDescription(
                '> Benvenuto nella **Dashboard Premium** di MinfoAi\n' +
                '> Seleziona una categoria dal menu per iniziare la configurazione\n\n' +
                '**📊 Panoramica Configurazione**\n' +
                '└ Tutte le impostazioni vengono salvate automaticamente nel database'
            )
            .addFields(
                {
                    name: '👋 Benvenuti & Addii',
                    value: '```yaml\nMessaggi personalizzati\nCanali dedicati\nEmbed customizzabili\n```',
                    inline: true
                },
                {
                    name: '🎵 Sistema Musicale',
                    value: '```yaml\nCanali vocali\nPermessi membri\nCode e playlist\n```',
                    inline: true
                },
                {
                    name: '🛡️ Moderazione Auto',
                    value: '```yaml\nFiltri parole\nAnti-spam sistema\nLog moderazione\n```',
                    inline: true
                },
                {
                    name: '🎮 Gamification XP',
                    value: '```yaml\nLivelli e ranks\nRicompense ruoli\nLeaderboard\n```',
                    inline: true
                },
                {
                    name: '🎁 Giveaway Manager',
                    value: '```yaml\nPremi automatici\nPartecipanti\nTimer custom\n```',
                    inline: true
                },
                {
                    name: '❓ Centro Assistenza',
                    value: '```yaml\nGuide configurazione\nDocumentazione\nSupporto live\n```',
                    inline: true
                }
            )
            .setFooter({ 
                text: `Dashboard richiesta da ${interaction.user.tag} • MinfoAi Premium`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('setbot_category')
            .setPlaceholder('🔧 Seleziona una categoria per configurare le impostazioni')
            .setMinValues(1)
            .setMaxValues(1)
            .addOptions(
                {
                    label: 'Messaggi di Benvenuto',
                    description: 'Configura messaggi e canali per i nuovi membri',
                    value: 'welcome',
                    emoji: '👋'
                },
                {
                    label: 'Messaggi di Addio',
                    description: 'Imposta messaggi quando un membro lascia il server',
                    value: 'goodbye',
                    emoji: '👋'
                },
                {
                    label: 'Sistema Musicale',
                    description: 'Configura canali e permessi per la musica',
                    value: 'music',
                    emoji: '🎵'
                },
                {
                    label: 'Moderazione Automatica',
                    description: 'Sistema auto-moderazione e filtri avanzati',
                    value: 'moderation',
                    emoji: '🛡️'
                },
                {
                    label: 'Sistema Gamification',
                    description: 'Livelli, XP, ranks e ricompense per membri',
                    value: 'gamification',
                    emoji: '🎮'
                },
                {
                    label: 'Gestione Giveaway',
                    description: 'Crea e gestisci giveaway con premi automatici',
                    value: 'giveaway',
                    emoji: '🎁'
                }
            );

        const refreshButton = new ButtonBuilder()
            .setCustomId('setbot_refresh')
            .setLabel('Aggiorna Dashboard')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('🔄');

        const helpButton = new ButtonBuilder()
            .setCustomId('setbot_help')
            .setLabel('Guida & Supporto')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('❓');

        const statusButton = new ButtonBuilder()
            .setCustomId('setbot_status')
            .setLabel('Stato Sistema')
            .setStyle(ButtonStyle.Success)
            .setEmoji('📊');

        const row1 = new ActionRowBuilder().addComponents(selectMenu);
        const row2 = new ActionRowBuilder().addComponents(refreshButton, helpButton, statusButton);

        await interaction.reply({
            embeds: [embed],
            components: [row1, row2],
            ephemeral: true
        });
    }
};
