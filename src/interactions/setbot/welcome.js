const { EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, ChannelType, RoleSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../database/models/GuildConfig');

module.exports = {
    customId: 'welcome',
    
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
            const welcomeConfig = config.welcome || {};
            
            const embed = new EmbedBuilder()
                .setColor(welcomeConfig.embedColor || '#00FF7F')
                .setTitle('👋 Configurazione Benvenuto')
                .setDescription('Configura il sistema di benvenuto per il tuo server!\n\n' +
                    '**Funzionalità disponibili:**\n' +
                    '✅ Messaggio personalizzato con variabili dinamiche\n' +
                    '✅ Embed premium con colori personalizzabili\n' +
                    '✅ Immagini di benvenuto automatiche\n' +
                    '✅ Ruoli automatici al join\n' +
                    '✅ Canale di benvenuto dedicato\n\n' +
                    'Seleziona cosa vuoi configurare:')
                .addFields(
                    {
                        name: '📝 Stato Attuale',
                        value: `\`\`\`\n` +
                            `Stato: ${welcomeConfig.enabled ? '✅ Abilitato' : '❌ Disabilitato'}\n` +
                            `Canale: ${welcomeConfig.channelId ? `<#${welcomeConfig.channelId}>` : 'Non configurato'}\n` +
                            `Messaggio: ${welcomeConfig.message ? 'Configurato' : 'Default'}\n` +
                            `Ruolo Auto: ${welcomeConfig.autoRoleId ? `<@&${welcomeConfig.autoRoleId}>` : 'Disabilitato'}\n` +
                            `Immagine: ${welcomeConfig.imageEnabled ? 'Abilitata' : 'Disabilitata'}\n` +
                            `Colore: ${welcomeConfig.embedColor || '#00FF7F'}\n` +
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
                .setCustomId('welcome_config_option')
                .setPlaceholder('🔧 Seleziona un\'opzione da configurare')
                .addOptions(
                    {
                        label: 'Imposta Canale',
                        description: 'Scegli il canale per i messaggi di benvenuto',
                        value: 'welcome_set_channel',
                        emoji: '📝'
                    },
                    {
                        label: 'Messaggio Personalizzato',
                        description: 'Crea un messaggio di benvenuto custom',
                        value: 'welcome_set_message',
                        emoji: '✏️'
                    },
                    {
                        label: 'Colore Embed',
                        description: 'Personalizza il colore dell\'embed',
                        value: 'welcome_set_color',
                        emoji: '🎨'
                    },
                    {
                        label: 'Ruolo Automatico',
                        description: 'Assegna un ruolo automaticamente ai nuovi membri',
                        value: 'welcome_auto_role',
                        emoji: '🎭'
                    },
                    {
                        label: 'Immagine di Benvenuto',
                        description: 'Abilita/disabilita immagini automatiche',
                        value: 'welcome_image',
                        emoji: '🖼️'
                    },
                    {
                        label: 'Variabili Disponibili',
                        description: 'Mostra le variabili per messaggi personalizzati',
                        value: 'welcome_variables',
                        emoji: '📌'
                    }
                );

            const toggleButton = new ButtonBuilder()
                .setCustomId('welcome_toggle')
                .setLabel(welcomeConfig.enabled ? 'Disabilita' : 'Abilita')
                .setStyle(welcomeConfig.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
                .setEmoji(welcomeConfig.enabled ? '❌' : '✅');

            const backButton = new ButtonBuilder()
                .setCustomId('setbot_back')
                .setLabel('Torna Indietro')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⬅️');

            const previewButton = new ButtonBuilder()
                .setCustomId('welcome_preview')
                .setLabel('Anteprima Live')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('👁️')
                .setDisabled(!welcomeConfig.channelId);

            const row1 = new ActionRowBuilder().addComponents(selectMenu);
            const row2 = new ActionRowBuilder().addComponents(toggleButton, previewButton, backButton);

            await interaction.update({
                embeds: [embed],
                components: [row1, row2],
                ephemeral: true
            });
        } catch (error) {
            console.error('Errore welcome config:', error);
            await interaction.reply({
                content: '❌ Errore nel caricamento configurazione benvenuto.',
                ephemeral: true
            });
        }
    }
};
