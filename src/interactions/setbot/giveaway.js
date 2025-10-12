const { EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, RoleSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../database/models/GuildConfig');

// UX Helper: Genera paginazione intuitiva
function createPagination(currentPage, totalPages, customIdPrefix) {
    const buttons = [];
    
    if (totalPages > 2) {
        buttons.push(new ButtonBuilder()
            .setCustomId(`${customIdPrefix}_first`)
            .setEmoji('⏮️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage === 1));
    }
    
    buttons.push(new ButtonBuilder()
        .setCustomId(`${customIdPrefix}_prev`)
        .setLabel('Indietro')
        .setEmoji('◀️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === 1));
    
    buttons.push(new ButtonBuilder()
        .setCustomId(`${customIdPrefix}_page_indicator`)
        .setLabel(`Pagina ${currentPage}/${totalPages}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true));
    
    buttons.push(new ButtonBuilder()
        .setCustomId(`${customIdPrefix}_next`)
        .setLabel('Avanti')
        .setEmoji('▶️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === totalPages));
    
    if (totalPages > 2) {
        buttons.push(new ButtonBuilder()
            .setCustomId(`${customIdPrefix}_last`)
            .setEmoji('⏭️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage === totalPages));
    }
    
    return buttons;
}

// UX Helper: Crea embed con guida rapida
function createHelpEmbed(title, description, fields, color = '#E91E63', activeCategory = null) {
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
    customId: 'giveaway',
    
    async execute(interaction) {
        // Verifica permessi
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({
                embeds: [createFeedbackEmbed('error', 
                    'Permessi Insufficienti', 
                    'Ti serve il permesso **Gestisci Server** per configurare i giveaway.')],
                ephemeral: true
            });
        }
        
        try {
            // Carica config attuale
            const config = await GuildConfig.findOne({ guildId: interaction.guild.id }) || {};
            const giveawayConfig = config.giveaway || {};
            
            // Check permessi bot
            const botMember = interaction.guild.members.me;
            const canSendMessages = botMember.permissions.has(PermissionFlagsBits.SendMessages);
            const canManageMessages = botMember.permissions.has(PermissionFlagsBits.ManageMessages);
            const canAddReactions = botMember.permissions.has(PermissionFlagsBits.AddReactions);
            
            // Embed principale con highlight categoria attiva
            const embed = createHelpEmbed(
                '🎁 Configurazione Giveaway',
                '**Sistema Giveaway Automatico e Personalizzabile**\n\n' +
                'Crea giveaway coinvolgenti per il tuo server con estrazione automatica, ' +
                'requisiti personalizzati e protezione anti-bot.\n\n' +
                '**📋 Funzionalità Disponibili:**\n' +
                (canSendMessages && canManageMessages && canAddReactions ? '✅' : '⚠️') + ' Giveaway automatici programmabili\n' +
                '✅ Requisiti personalizzati (ruoli, livelli, account age)\n' +
                '✅ Sistema anti-bot e anti-alt accounts\n' +
                '✅ Riestrazione automatica se vincitore non valido\n' +
                (canSendMessages ? '✅' : '⚠️') + ' Notifiche automatiche vincitori\n' +
                '✅ Cronologia giveaway completa\n\n' +
                ((!canSendMessages || !canManageMessages || !canAddReactions) ? 
                    '⚠️ **Attenzione**: Il bot necessita permessi aggiuntivi per funzionare\n\n' : '') +
                '👇 **Seleziona cosa configurare dal menu:**',
                [
                    {
                        name: '📊 Stato Corrente',
                        value: `\`\`\`\n` +
                            `Canale Default: ${giveawayConfig.channelId ? '<#' + giveawayConfig.channelId + '>' : '❌ Non impostato'}\n` +
                            `Ruolo Ping: ${giveawayConfig.pingRoleId ? '<@&' + giveawayConfig.pingRoleId + '>' : '❌ Non impostato'}\n` +
                            `Durata Default: ${giveawayConfig.defaultDuration || '7 giorni (default)'}\n` +
                            `Livello Minimo: ${giveawayConfig.minLevel ? 'Livello ' + giveawayConfig.minLevel : '❌ Nessun requisito'}\n` +
                            `Anti-Alt: ${giveawayConfig.minAccountAge ? giveawayConfig.minAccountAge + ' giorni' : '❌ Disabilitato'}\n` +
                            `Giveaway Attivi: ${giveawayConfig.activeGiveaways?.length || 0}\n` +
                            `\`\`\``,
                        inline: false
                    }
                ],
                '#E91E63',
                'giveaway'
            );
            
            // Menu opzioni con filtri permessi
            const baseOptions = [
                {
                    label: '🎉 Crea Giveaway',
                    description: 'Avvia un nuovo giveaway interattivo',
                    value: 'giveaway_create',
                    emoji: '🎉',
                    requiredBotPermission: canSendMessages && canManageMessages && canAddReactions
                },
                {
                    label: '📢 Canale Default',
                    description: 'Imposta dove pubblicare i giveaway',
                    value: 'giveaway_set_channel',
                    emoji: '📢'
                },
                {
                    label: '🔔 Ruolo Notifica',
                    description: 'Ruolo da pingare per nuovi giveaway',
                    value: 'giveaway_ping_role',
                    emoji: '🔔'
                },
                {
                    label: '✅ Requisiti Partecipazione',
                    description: 'Livello minimo, ruoli richiesti, anti-alt',
                    value: 'giveaway_requirements',
                    emoji: '✅'
                },
                {
                    label: '⏰ Durata Default',
                    description: 'Imposta durata predefinita (es. 7d, 24h)',
                    value: 'giveaway_duration',
                    emoji: '⏰'
                },
                {
                    label: '📋 Giveaway Attivi',
                    description: 'Visualizza, modifica o termina in anticipo',
                    value: 'giveaway_list',
                    emoji: '📋'
                },
                {
                    label: '📈 Cronologia',
                    description: 'Storico giveaway passati e vincitori',
                    value: 'giveaway_history',
                    emoji: '📈'
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
                    description: 'Bot necessita permessi: Messaggi, Reazioni',
                    value: 'giveaway_permissions_info',
                    emoji: 'ℹ️'
                });
            }
            
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('giveaway_config_option')
                .setPlaceholder('🔧 Scegli cosa configurare...')
                .addOptions(availableOptions.map(opt => ({
                    label: opt.label,
                    description: opt.description,
                    value: opt.value,
                    emoji: opt.emoji
                })));
            
            // Pulsanti azione principali
            const createButton = new ButtonBuilder()
                .setCustomId('giveaway_quick_create')
                .setLabel('Crea Rapido')
                .setStyle(ButtonStyle.Success)
                .setEmoji('⚡')
                .setDisabled(!giveawayConfig.channelId || !canSendMessages);
            
            const previewButton = new ButtonBuilder()
                .setCustomId('giveaway_preview')
                .setLabel('Anteprima')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('👁️')
                .setDisabled(!giveawayConfig.channelId);
            
            const saveButton = new ButtonBuilder()
                .setCustomId('giveaway_save')
                .setLabel('Salva')
                .setStyle(ButtonStyle.Success)
                .setEmoji('💾')
                .setDisabled(true); // Abilitato dopo modifiche
            
            const cancelButton = new ButtonBuilder()
                .setCustomId('giveaway_cancel')
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
            const row2 = new ActionRowBuilder().addComponents(createButton, previewButton, backButton);
            const row3 = new ActionRowBuilder().addComponents(saveButton, cancelButton);
            
            await interaction.update({
                embeds: [embed],
                components: [row1, row2, row3],
                ephemeral: true
            });
            
        } catch (error) {
            console.error('Errore giveaway config:', error);
            await interaction.reply({
                embeds: [createFeedbackEmbed('error', 
                    'Errore di Sistema', 
                    'Impossibile caricare la configurazione. Riprova tra poco o contatta il supporto.')],
                ephemeral: true
            });
        }
    }
};
