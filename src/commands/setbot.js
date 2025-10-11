const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setbot')
        .setDescription('🏛️ Dashboard Premium - Configura tutte le funzionalità del bot con stile moderno'),
    
    async execute(interaction) {
        // Verifica permessi admin
        if (!interaction.member.permissions.has('Administrator')) {
            return interaction.reply({
                content: '🚫 **Accesso Negato** • Solo gli amministratori possono accedere alla dashboard premium.',
                ephemeral: true
            });
        }

        // Embed informativo
        const embed = new EmbedBuilder()
            .setColor([88, 101, 242])
            .setAuthor({ 
                name: '🏛️ MinfoAi Premium Dashboard',
                iconURL: interaction.client.user.displayAvatarURL({ dynamic: true, size: 512 })
            })
            .setDescription(
                '✨ **Benvenuto nella Dashboard Premium di MinfoAi**\n' +
                '──────────────────────────────────────\n\n' +
                '🎨 **Interfaccia Moderna** • Configura ogni aspetto del bot con eleganza\n' +
                '⚡ **Salvataggio Automatico** • Tutte le modifiche vengono salvate istantaneamente\n' +
                '🔧 **Controllo Completo** • Accesso a tutte le funzionalità avanzate\n\n' +
                '**📝 Clicca il pulsante qui sotto per la documentazione completa**'
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
                }
            )
            .setFooter({
                text: `Richiesto da ${interaction.user.username}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true })
            })
            .setTimestamp();

        // Bottone con link safe alla documentazione
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('📚 Documentazione Completa')
                    .setStyle(ButtonStyle.Link)
                    .setURL('https://github.com/Fl4chi/MinfoAi/wiki')
            );

        await interaction.reply({
            embeds: [embed],
            components: [row],
            ephemeral: false
        });
    }
};
