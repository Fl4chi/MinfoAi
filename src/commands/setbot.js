const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setbot')
        .setDescription('🎛️ Dashboard interattiva per configurare tutte le funzionalità del bot'),
    
    async execute(interaction) {
        // Verifica permessi admin
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({
                content: '❌ Non hai i permessi per utilizzare questo comando!',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🎛️ Dashboard Configurazione Bot')
            .setDescription('Benvenuto nella dashboard interattiva di **MinfoAi**!\n\n' +
                'Seleziona la categoria che desideri configurare dal menu sottostante.\n' +
                'Tutte le modifiche saranno salvate automaticamente nel database.')
            .addFields(
                {
                    name: '👋 Benvenuti',
                    value: 'Configura messaggi di benvenuto personalizzati',
                    inline: true
                },
                {
                    name: '👋 Addii',
                    value: 'Configura messaggi di addio per i membri',
                    inline: true
                },
                {
                    name: '🎵 Musica',
                    value: 'Imposta canali e permessi musicali',
                    inline: true
                },
                {
                    name: '🛡️ Moderazione',
                    value: 'Sistema di moderazione e auto-mod',
                    inline: true
                },
                {
                    name: '🎮 Gamification',
                    value: 'Livelli, XP e reward per membri attivi',
                    inline: true
                },
                {
                    name: '🎁 Giveaway',
                    value: 'Gestione giveaway e premi',
                    inline: true
                }
            )
            .setFooter({
                text: `Richiesto da ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('setbot_category')
            .setPlaceholder('🔧 Seleziona una categoria da configurare')
            .addOptions(
                {
                    label: 'Benvenuti',
                    description: 'Configura i messaggi di benvenuto',
                    value: 'welcome',
                    emoji: '👋'
                },
                {
                    label: 'Addii',
                    description: 'Configura i messaggi di addio',
                    value: 'goodbye',
                    emoji: '👋'
                },
                {
                    label: 'Musica',
                    description: 'Imposta le impostazioni musicali',
                    value: 'music',
                    emoji: '🎵'
                },
                {
                    label: 'Moderazione',
                    description: 'Sistema di moderazione automatica',
                    value: 'moderation',
                    emoji: '🛡️'
                },
                {
                    label: 'Gamification',
                    description: 'Sistema livelli e XP',
                    value: 'gamification',
                    emoji: '🎮'
                },
                {
                    label: 'Giveaway',
                    description: 'Gestisci giveaway e premi',
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
            .setLabel('Aiuto')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('❓');

        const row1 = new ActionRowBuilder().addComponents(selectMenu);
        const row2 = new ActionRowBuilder().addComponents(refreshButton, helpButton);

        await interaction.reply({
            embeds: [embed],
            components: [row1, row2],
            ephemeral: true
        });
    }
};
