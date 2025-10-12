const { EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ButtonBuilder, ButtonStyle, ChannelType, RoleSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../database/models/GuildConfig');

// UX Helper: Crea embed con guida rapida
function createHelpEmbed(title, description, fields, color = '#00FF7F', activeCategory = null) {
    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`${activeCategory ? '🔹 ' : ''}${title}`)
        .setDescription(description)
        .setFooter({ text: '💡 Usa i menu e pulsanti per navigare • Mobile-friendly' })
        .setTimestamp();
    
    if (fields && fields.length > 0) {
        embed.addFields(fields);
    }
    
    return embed;
}

// UX Helper: Feedback success/error visibili
function createFeedbackEmbed(type, message, details = null) {
    const colors = {
        success: '#2ECC71',
        error: '#E74C3C',
        warning: '#F39C12',
        info: '#3498DB'
    };
    
    const emojis = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    const embed = new EmbedBuilder()
        .setColor(colors[type] || colors.info)
        .setDescription(`${emojis[type]} **${message}**${details ? `\n\n${details}` : ''}`)
        .setTimestamp();
    
    return embed;
}

module.exports = {
    customId: 'welcome',
    
    async execute(interaction) {
        // Verifica permessi
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({
                embeds: [createFeedbackEmbed('error', 
                    'Permessi Insufficienti', 
                    'Ti serve il permesso **Gestisci Server** per configurare i messaggi di benvenuto.')],
                ephemeral: true
            });
        }
        
        try {
            // Carica config attuale
            const config = await GuildConfig.findOne({ guildId: interaction.guild.id }) || {};
            const welcomeConfig = config.welcome || {};
            
            // Check permessi bot
            const botMember = interaction.guild.members.me;
            const canSendMessages = botMember.permissions.has(PermissionFlagsBits.SendMessages);
            const canEmbedLinks = botMember.permissions.has(PermissionFlagsBits.EmbedLinks);
            const canManageRoles = botMember.permissions.has(PermissionFlagsBits.ManageRoles);
            const canAttachFiles = botMember.permissions.has(PermissionFlagsBits.AttachFiles);
            
            // Embed principale con highlight categoria attiva
            const embed = createHelpEmbed(
                '👋 Configurazione Benvenuto',
                '**Sistema di Benvenuto Automatico e Personalizzato**\n\n' +
                'Accogli i nuovi membri con messaggi personalizzati, embed eleganti, ' +
                'immagini automatiche e ruoli di benvenuto.\n\n' +
                '**📋 Funzionalità Disponibili:**\n' +
                (canSendMessages ? '✅' : '⚠️') + ' Messaggi personalizzati con variabili dinamiche\n' +
                (canEmbedLinks ? '✅' : '⚠️') + ' Embed premium con colori personalizzabili\n' +
                (canAttachFiles ? '✅' : '⚠️') + ' Immagini di benvenuto automatiche\n' +
                (canManageRoles ? '✅' : '⚠️') + ' Assegnazione ruolo automatica al join\n' +
                '✅ Canale benvenuto dedicato\n' +
                '✅ Anteprima live del messaggio\n\n' +
                ((!canSendMessages || !canEmbedLinks || !canManageRoles) ? 
                    '⚠️ **Attenzione**: Il bot necessita permessi aggiuntivi\n\n' : '') +
                '👇 **Seleziona cosa configurare dal menu:**',
                [
                    {
                        name: '📊 Stato Corrente',
                        value: `\`\`\`\n` +
                            `Sistema: ${welcomeConfig.enabled ? '🟢 ATTIVO' : '🔴 DISATTIVATO'}\n` +
                            `Canale: ${welcomeConfig.channelId ? '<#' + welcomeConfig.channelId + '>' : '❌ Non impostato'}\n` +
                            `Messaggio: ${welcomeConfig.message ? 'Personalizzato' : 'Default'}\n` +
                            `Ruolo Auto: ${welcomeConfig.autoRoleId ? '<@&' + welcomeConfig.autoRoleId + '>' : '❌ Disabilitato'}\n` +
                            `Immagine: ${welcomeConfig.imageEnabled ? '✅ Abilitata' : '❌ Disabilitata'}\n` +
                            `Colore Embed: ${welcomeConfig.embedColor || '#00FF7F (default)'}\n` +
                            `\`\`\``,
                        inline: false
                    },
                    {
                        name: '📌 Variabili Disponibili',
                        value: '`{user}` - Nome utente | `{mention}` - Menzione utente\n' +
                               '`{server}` - Nome server | `{count}` - Conteggio membri\n' +
                               '`{tag}` - Username#1234 | `{id}` - ID utente',
                        inline: false
                    }
                ],
                welcomeConfig.embedColor || '#00FF7F',
                'welcome'
            );
            
            // Menu opzioni
            const baseOptions = [
                {
                    label: '📢 Canale Benvenuto',
                    description: 'Imposta dove inviare i messaggi di benvenuto',
                    value: 'welcome_set_channel',
                    emoji: '📢',
                    requiredBotPermission: canSendMessages
                },
                {
                    label: '✏️ Messaggio Custom',
                    description: 'Personalizza testo e contenuto del messaggio',
                    value: 'welcome_set_message',
                    emoji: '✏️'
                },
                {
                    label: '🎨 Colore Embed',
                    description: 'Scegli il colore dell\'embed (es. #00FF7F)',
                    value: 'welcome_set_color',
                    emoji: '🎨',
                    requiredBotPermission: canEmbedLinks
                },
                {
                    label: '🎭 Ruolo Automatico',
                    description: 'Assegna automaticamente un ruolo ai nuovi membri',
                    value: 'welcome_auto_role',
                    emoji: '🎭',
                    requiredBotPermission: canManageRoles
                },
                {
                    label: '🖼️ Immagine Benvenuto',
                    description: 'Genera immagini personalizzate per i nuovi membri',
                    value: 'welcome_image',
                    emoji: '🖼️',
                    requiredBotPermission: canAttachFiles
                },
                {
                    label: '👁️ Anteprima Live',
                    description: 'Visualizza come apparirà il messaggio di benvenuto',
                    value: 'welcome_preview',
                    emoji: '👁️'
                },
                {
                    label: '📌 Guida Variabili',
                    description: 'Lista completa variabili per messaggi dinamici',
                    value: 'welcome_variables',
                    emoji: '📌'
                }
            ];
            
            // Filtra opzioni per permessi bot
            const availableOptions = baseOptions.filter(opt => {
                if (opt.requiredBotPermission !== undefined && !opt.requiredBotPermission) {
                    return false;
                }
                return true;
            });
            
            // Aggiungi info permessi mancanti
            if (availableOptions.length < baseOptions.length) {
                availableOptions.push({
                    label: '⚠️ Opzioni Nascoste',
                    description: 'Bot necessita: Invia Messaggi, Embed, Gestisci Ruoli',
                    value: 'welcome_permissions_info',
                    emoji: 'ℹ️'
                });
            }
            
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('welcome_config_option')
                .setPlaceholder('🔧 Scegli cosa configurare...')
                .addOptions(availableOptions.map(opt => ({
                    label: opt.label,
                    description: opt.description,
                    value: opt.value,
                    emoji: opt.emoji
                })));
            
            // Pulsanti azione principali
            const toggleButton = new ButtonBuilder()
                .setCustomId('welcome_toggle')
                .setLabel(welcomeConfig.enabled ? 'Disabilita Sistema' : 'Abilita Sistema')
                .setStyle(welcomeConfig.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
                .setEmoji(welcomeConfig.enabled ? '🔴' : '🟢');
            
            const previewButton = new ButtonBuilder()
                .setCustomId('welcome_preview')
                .setLabel('Anteprima')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('👁️')
                .setDisabled(!welcomeConfig.channelId || !canSendMessages);
            
            const saveButton = new ButtonBuilder()
                .setCustomId('welcome_save')
                .setLabel('Salva')
                .setStyle(ButtonStyle.Success)
                .setEmoji('💾')
                .setDisabled(true); // Abilitato dopo modifiche
            
            const cancelButton = new ButtonBuilder()
                .setCustomId('welcome_cancel')
                .setLabel('Annulla')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('❌');
            
            const backButton = new ButtonBuilder()
                .setCustomId('setbot_back')
                .setLabel('Menu Principale')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⬅️');
            
            // Layout componenti mobile-friendly
            const row1 = new ActionRowBuilder().addComponents(selectMenu);
            const row2 = new ActionRowBuilder().addComponents(toggleButton, previewButton, backButton);
            const row3 = new ActionRowBuilder().addComponents(saveButton, cancelButton);
            
            await interaction.update({
                embeds: [embed],
                components: [row1, row2, row3],
                ephemeral: true
            });
            
        } catch (error) {
            console.error('Errore welcome config:', error);
            await interaction.reply({
                embeds: [createFeedbackEmbed('error', 
                    'Errore di Sistema', 
                    'Impossibile caricare la configurazione. Riprova tra poco o contatta il supporto.')],
                ephemeral: true
            });
        }
    }
};
