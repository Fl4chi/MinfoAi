const { EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, RoleSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../database/models/GuildConfig');

module.exports = {
    customId: 'moderation',
    
    async execute(interaction) {
        // Verifica permessi
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({
                content: '❌ Non hai i permessi necessari (Gestisci Server richiesto).',
                ephemeral: true
            });
        }

        try {
            // Carica config attuale
            const config = await GuildConfig.findOne({ guildId: interaction.guild.id }) || {};
            const modConfig = config.moderation || {};
            
            const embed = new EmbedBuilder()
                .setColor('#E74C3C')
                .setTitle('🛡️ Configurazione Moderazione')
                .setDescription('Configura il sistema di moderazione per il tuo server!\n\n' +
                    '**Funzionalità disponibili:**\n' +
                    '✅ Auto-moderazione spam e flood\n' +
                    '✅ Filtro parole proibite\n' +
                    '✅ Sistema warn/kick/ban automatico\n' +
                    '✅ Log azioni di moderazione\n' +
                    '✅ Sistema di appelli\n\n' +
                    'Seleziona cosa vuoi configurare:')
                .addFields(
                    {
                        name: '📝 Stato Attuale',
                        value: `\`\`\`\n` +
                            `Auto-mod: ${modConfig.automod ? 'Abilitato' : 'Disabilitato'}\n` +
                            `Filtro Parole: ${modConfig.wordFilter ? `${modConfig.bannedWords?.length || 0} parole` : 'Disabilitato'}\n` +
                            `Log Canale: ${modConfig.logChannelId ? `<#${modConfig.logChannelId}>` : 'Non configurato'}\n` +
                            `Warn System: ${modConfig.warnSystem ? 'Attivo' : 'Disabilitato'}\n` +
                            `Max Warn: ${modConfig.maxWarns || 3}\n` +
                            `\`\`\``,
                        inline: false
                    }
                )
                .setFooter({
                    text: `Configurazione richiesta da ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp();

            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('moderation_config_option')
                .setPlaceholder('🔧 Seleziona un\'opzione da configurare')
                .addOptions(
                    {
                        label: 'Auto-Moderazione',
                        description: 'Abilita sistema anti-spam e flood',
                        value: 'moderation_automod',
                        emoji: '🤖'
                    },
                    {
                        label: 'Filtro Parole',
                        description: 'Configura il filtro parole proibite',
                        value: 'moderation_wordfilter',
                        emoji: '🚫'
                    },
                    {
                        label: 'Canale Log',
                        description: 'Imposta canale per i log di moderazione',
                        value: 'moderation_log_channel',
                        emoji: '📝'
                    },
                    {
                        label: 'Sistema Warn',
                        description: 'Configura sistema avvertimenti progressivi',
                        value: 'moderation_warn_system',
                        emoji: '⚠️'
                    },
                    {
                        label: 'Ruolo Moderatore',
                        description: 'Imposta ruolo per moderatori',
                        value: 'moderation_mod_role',
                        emoji: '👮'
                    },
                    {
                        label: 'Anti-Raid',
                        description: 'Configura protezione anti-raid',
                        value: 'moderation_antiraid',
                        emoji: '🛡️'
                    }
                );

            const backButton = new ButtonBuilder()
                .setCustomId('setbot_back')
                .setLabel('Torna Indietro')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⬅️');

            const testButton = new ButtonBuilder()
                .setCustomId('moderation_test')
                .setLabel('Test Sistema')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🧪')
                .setDisabled(!modConfig.logChannelId);

            const row1 = new ActionRowBuilder().addComponents(selectMenu);
            const row2 = new ActionRowBuilder().addComponents(testButton, backButton);

            await interaction.update({
                embeds: [embed],
                components: [row1, row2],
                ephemeral: true
            });
        } catch (error) {
            console.error('Errore moderation config:', error);
            await interaction.reply({
                content: '❌ Errore nel caricamento configurazione moderazione.',
                ephemeral: true
            });
        }
    }
};
