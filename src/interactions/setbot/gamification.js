const { EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, RoleSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../database/models/GuildConfig');

// UX Helper: Genera paginazione intuitiva
function createPagination(currentPage, totalPages, customIdPrefix) {
    const buttons = [];
    
    // Pulsante "Prima Pagina"
    if (totalPages > 2) {
        buttons.push(new ButtonBuilder()
            .setCustomId(`${customIdPrefix}_first`)
            .setEmoji('⏮️')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(currentPage === 1));
    }
    
    // Pulsante "Indietro"
    buttons.push(new ButtonBuilder()
        .setCustomId(`${customIdPrefix}_prev`)
        .setLabel('Indietro')
        .setEmoji('◀️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === 1));
    
    // Indicatore pagina
    buttons.push(new ButtonBuilder()
        .setCustomId(`${customIdPrefix}_page_indicator`)
        .setLabel(`Pagina ${currentPage}/${totalPages}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true));
    
    // Pulsante "Avanti"
    buttons.push(new ButtonBuilder()
        .setCustomId(`${customIdPrefix}_next`)
        .setLabel('Avanti')
        .setEmoji('▶️')
        .setStyle(ButtonStyle.Primary)
        .setDisabled(currentPage === totalPages));
    
    // Pulsante "Ultima Pagina"
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
function createHelpEmbed(title, description, fields, color = '#F1C40F', activeCategory = null) {
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

// UX Helper: Verifica permessi e mostra solo opzioni disponibili
function filterOptionsByPermissions(member, options) {
    return options.filter(option => {
        if (option.requiredPermission) {
            return member.permissions.has(option.requiredPermission);
        }
        return true;
    });
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
    customId: 'gamification',
    
    async execute(interaction) {
        // Verifica permessi
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({
                embeds: [createFeedbackEmbed('error', 
                    'Permessi Insufficienti', 
                    'Ti serve il permesso **Gestisci Server** per configurare il sistema di gamification.')],
                ephemeral: true
            });
        }
        
        try {
            // Carica config attuale
            const config = await GuildConfig.findOne({ guildId: interaction.guild.id }) || {};
            const gamificationConfig = config.gamification || {};
            
            // Determina se sistema è configurabile (check permessi bot)
            const botMember = interaction.guild.members.me;
            const canManageRoles = botMember.permissions.has(PermissionFlagsBits.ManageRoles);
            const canSendMessages = botMember.permissions.has(PermissionFlagsBits.SendMessages);
            
            // Embed principale con highlight categoria attiva
            const embed = createHelpEmbed(
                '🎮 Configurazione Gamification',
                '**Sistema di Livelli e Ricompense XP**\n\n' +
                'Motiva i membri del tuo server con un sistema di progressione! ' +
                'Guadagnano XP chattando e ricevono ruoli speciali al raggiungimento di determinati livelli.\n\n' +
                '**📋 Funzionalità Disponibili:**\n' +
                (canManageRoles ? '✅' : '⚠️') + ' Sistema livelli con XP progressivi\n' +
                (canManageRoles ? '✅' : '⚠️') + ' Ruoli reward automatici al level up\n' +
                (canSendMessages ? '✅' : '⚠️') + ' Notifiche personalizzate level up\n' +
                '✅ Leaderboard dinamica top utenti\n' +
                '✅ XP boost per canali specifici\n' +
                '✅ Moltiplicatori XP temporanei\n\n' +
                ((!canManageRoles || !canSendMessages) ? 
                    '⚠️ **Attenzione**: Alcune funzioni richiedono permessi bot aggiuntivi\n\n' : '') +
                '👇 **Seleziona cosa configurare dal menu:**',
                [
                    {
                        name: '📊 Stato Corrente',
                        value: `\`\`\`\n` +
                            `Sistema: ${gamificationConfig.enabled ? '🟢 ATTIVO' : '🔴 DISATTIVATO'}\n` +
                            `XP per Messaggio: ${gamificationConfig.xpPerMessage || '10-20 (default)'}\n` +
                            `Ruoli Reward: ${gamificationConfig.roleRewards?.length || 0} configurati\n` +
                            `Canale Notifiche: ${gamificationConfig.levelChannelId ? '<#' + gamificationConfig.levelChannelId + '>' : '❌ Non impostato'}\n` +
                            `Moltiplicatore XP: ${gamificationConfig.xpMultiplier || 1.0}x\n` +
                            `Canali Boost: ${gamificationConfig.boostChannels?.length || 0} attivi\n` +
                            `\`\`\``,
                        inline: false
                    }
                ],
                '#F1C40F',
                'gamification'
            );
            
            // Menu opzioni (filtrato per permessi)
            const baseOptions = [
                {
                    label: 'Sistema XP Base',
                    description: 'Configura guadagno XP per messaggio (min/max)',
                    value: 'gamification_xp_system',
                    emoji: '⭐'
                },
                {
                    label: 'Ruoli Reward',
                    description: 'Ruoli automatici al raggiungimento livelli',
                    value: 'gamification_role_rewards',
                    emoji: '🎖️',
                    requiredPermission: PermissionFlagsBits.ManageRoles
                },
                {
                    label: 'Canale Notifiche',
                    description: 'Dove inviare messaggi di level up',
                    value: 'gamification_level_channel',
                    emoji: '📢',
                    requiredPermission: PermissionFlagsBits.SendMessages
                },
                {
                    label: 'Boost XP Globale',
                    description: 'Moltiplicatore XP temporaneo per tutto il server',
                    value: 'gamification_xp_boost',
                    emoji: '🚀'
                },
                {
                    label: 'Canali Bonus XP',
                    description: 'Canali con guadagno XP maggiorato (2x, 3x...)',
                    value: 'gamification_boost_channels',
                    emoji: '💯'
                },
                {
                    label: 'Leaderboard',
                    description: 'Personalizza classifica e premi top utenti',
                    value: 'gamification_leaderboard',
                    emoji: '🏆'
                }
            ];
            
            // Filtra opzioni per permessi utente e bot
            const availableOptions = baseOptions.filter(opt => {
                // Check permessi utente
                if (opt.requiredPermission && !interaction.member.permissions.has(opt.requiredPermission)) {
                    return false;
                }
                // Check permessi bot
                if (opt.requiredPermission === PermissionFlagsBits.ManageRoles && !canManageRoles) {
                    return false;
                }
                if (opt.requiredPermission === PermissionFlagsBits.SendMessages && !canSendMessages) {
                    return false;
                }
                return true;
            });
            
            // Aggiungi indicatore permessi mancanti se necessario
            if (availableOptions.length < baseOptions.length) {
                availableOptions.push({
                    label: '⚠️ Opzioni Nascoste',
                    description: 'Alcune opzioni richiedono permessi aggiuntivi',
                    value: 'gamification_permissions_info',
                    emoji: 'ℹ️'
                });
            }
            
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('gamification_config_option')
                .setPlaceholder('🔧 Scegli un\'opzione da configurare...')
                .addOptions(availableOptions.map(opt => ({
                    label: opt.label,
                    description: opt.description,
                    value: opt.value,
                    emoji: opt.emoji
                })));
            
            // Pulsanti azione principali
            const toggleButton = new ButtonBuilder()
                .setCustomId('gamification_toggle')
                .setLabel(gamificationConfig.enabled ? 'Disabilita Sistema' : 'Abilita Sistema')
                .setStyle(gamificationConfig.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
                .setEmoji(gamificationConfig.enabled ? '🔴' : '🟢');
            
            const saveButton = new ButtonBuilder()
                .setCustomId('gamification_save')
                .setLabel('Salva')
                .setStyle(ButtonStyle.Success)
                .setEmoji('💾')
                .setDisabled(true); // Abilitato solo dopo modifiche
            
            const cancelButton = new ButtonBuilder()
                .setCustomId('gamification_cancel')
                .setLabel('Annulla')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('❌');
            
            const statsButton = new ButtonBuilder()
                .setCustomId('gamification_stats')
                .setLabel('Statistiche')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📊')
                .setDisabled(!gamificationConfig.enabled);
            
            const backButton = new ButtonBuilder()
                .setCustomId('setbot_back')
                .setLabel('Menu Principale')
                .setStyle(ButtonStyle.Secondary)
                .setEmoji('⬅️');
            
            // Layout componenti mobile-friendly
            const row1 = new ActionRowBuilder().addComponents(selectMenu);
            const row2 = new ActionRowBuilder().addComponents(toggleButton, statsButton, backButton);
            const row3 = new ActionRowBuilder().addComponents(saveButton, cancelButton);
            
            await interaction.update({
                embeds: [embed],
                components: [row1, row2, row3],
                ephemeral: true
            });
            
        } catch (error) {
            console.error('Errore gamification config:', error);
            await interaction.reply({
                embeds: [createFeedbackEmbed('error', 
                    'Errore di Sistema', 
                    'Impossibile caricare la configurazione. Riprova tra poco o contatta il supporto.')],
                ephemeral: true
            });
        }
    }
};
