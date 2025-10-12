const { EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, RoleSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../database/models/GuildConfig');

// UX Helper: Crea embed con guida rapida
function createHelpEmbed(title, description, fields, color = '#E74C3C', activeCategory = null) {
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
    customId: 'moderation',
    
    async execute(interaction) {
        // Verifica permessi
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({
                embeds: [createFeedbackEmbed('error', 
                    'Permessi Insufficienti', 
                    'Ti serve il permesso **Gestisci Server** per configurare la moderazione.')],
                ephemeral: true
            });
        }
        
        try {
            // Carica config attuale
            const config = await GuildConfig.findOne({ guildId: interaction.guild.id }) || {};
            const modConfig = config.moderation || {};
            
            // Check permessi bot
            const botMember = interaction.guild.members.me;
            const canKick = botMember.permissions.has(PermissionFlagsBits.KickMembers);
            const canBan = botMember.permissions.has(PermissionFlagsBits.BanMembers);
            const canManageMessages = botMember.permissions.has(PermissionFlagsBits.ManageMessages);
            const canManageRoles = botMember.permissions.has(PermissionFlagsBits.ManageRoles);
            const canTimeout = botMember.permissions.has(PermissionFlagsBits.ModerateMembers);
            
            // Embed principale con highlight categoria attiva
            const embed = createHelpEmbed(
                '🛡️ Configurazione Moderazione',
                '**Sistema di Moderazione Avanzato e Automatizzato**\n\n' +
                'Proteggi il tuo server con auto-moderazione, filtri parole, sistema warn/kick/ban ' +
                'automatico, anti-raid e logging completo delle azioni.\n\n' +
                '**📋 Funzionalità Disponibili:**\n' +
                (canManageMessages ? '✅' : '⚠️') + ' Auto-moderazione spam e flood\n' +
                (canManageMessages ? '✅' : '⚠️') + ' Filtro parole proibite personalizzabile\n' +
                (canTimeout && canKick && canBan ? '✅' : '⚠️') + ' Sistema warn/timeout/kick/ban progressivo\n' +
                '✅ Log completo azioni di moderazione\n' +
                (canKick ? '✅' : '⚠️') + ' Sistema anti-raid con protezioni\n' +
                (canManageRoles ? '✅' : '⚠️') + ' Ruolo moderatore dedicato\n\n' +
                ((!canKick || !canBan || !canManageMessages || !canTimeout) ? 
                    '⚠️ **Attenzione**: Il bot necessita permessi aggiuntivi per funzionare\n\n' : '') +
                '👇 **Seleziona cosa configurare dal menu:**',
                [
                    {
                        name: '📊 Stato Corrente',
                        value: `\`\`\`\n` +
                            `Auto-Moderazione: ${modConfig.automod ? '🟢 ATTIVA' : '🔴 DISATTIVATA'}\n` +
                            `Filtro Parole: ${modConfig.wordFilter ? (modConfig.bannedWords?.length || 0) + ' parole bloccate' : '❌ Disattivato'}\n` +
                            `Canale Log: ${modConfig.logChannelId ? '<#' + modConfig.logChannelId + '>' : '❌ Non impostato'}\n` +
                            `Sistema Warn: ${modConfig.warnSystem ? '✅ Attivo' : '❌ Disattivato'}\n` +
                            `Max Warn: ${modConfig.maxWarns || 3} (poi ${modConfig.warnAction || 'kick'})\n` +
                            `Ruolo Mod: ${modConfig.modRoleId ? '<@&' + modConfig.modRoleId + '>' : '❌ Non impostato'}\n` +
                            `Anti-Raid: ${modConfig.antiRaid ? '🟢 Attivo' : '🔴 Disattivo'}\n` +
                            `\`\`\``,
                        inline: false
                    }
                ],
                '#E74C3C',
                'moderation'
            );
            
            // Menu opzioni con filtri permessi
            const baseOptions = [
                {
                    label: '🤖 Auto-Moderazione',
                    description: 'Abilita sistema anti-spam, flood e caps',
                    value: 'moderation_automod',
                    emoji: '🤖',
                    requiredBotPermission: canManageMessages
                },
                {
                    label: '🚫 Filtro Parole',
                    description: 'Gestisci lista parole proibite e wildcards',
                    value: 'moderation_wordfilter',
                    emoji: '🚫',
                    requiredBotPermission: canManageMessages
                },
                {
                    label: '📝 Canale Log',
                    description: 'Dove inviare log azioni moderazione',
                    value: 'moderation_log_channel',
                    emoji: '📝'
                },
                {
                    label: '⚠️ Sistema Warn',
                    description: 'Avvertimenti progressivi: warn → timeout → kick → ban',
                    value: 'moderation_warn_system',
                    emoji: '⚠️',
                    requiredBotPermission: canTimeout && canKick
                },
                {
                    label: '👮 Ruolo Moderatore',
                    description: 'Imposta ruolo per accesso comandi moderazione',
                    value: 'moderation_mod_role',
                    emoji: '👮',
                    requiredBotPermission: canManageRoles
                },
                {
                    label: '🛡️ Anti-Raid',
                    description: 'Protezione join massivo e account sospetti',
                    value: 'moderation_antiraid',
                    emoji: '🛡️',
                    requiredBotPermission: canKick
                },
                {
                    label: '📈 Statistiche Moderazione',
                    description: 'Visualizza report azioni mod del server',
                    value: 'moderation_stats',
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
                    description: 'Bot necessita: Kick, Ban, Timeout, Gestisci Messaggi',
                    value: 'moderation_permissions_info',
                    emoji: 'ℹ️'
                });
            }
            
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('moderation_config_option')
                .setPlaceholder('🔧 Scegli cosa configurare...')
                .addOptions(availableOptions.map(opt => ({
                    label: opt.label,
                    description: opt.description,
                    value: opt.value,
                    emoji: opt.emoji
                })));
            
            // Pulsanti azione principali
            const testButton = new ButtonBuilder()
                .setCustomId('moderation_test')
                .setLabel('Test Sistema')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('🧪')
                .setDisabled(!modConfig.logChannelId);
            
            const statsButton = new ButtonBuilder()
                .setCustomId('moderation_stats')
                .setLabel('Statistiche')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📈');
            
            const saveButton = new ButtonBuilder()
                .setCustomId('moderation_save')
                .setLabel('Salva')
                .setStyle(ButtonStyle.Success)
                .setEmoji('💾')
                .setDisabled(true); // Abilitato dopo modifiche
            
            const cancelButton = new ButtonBuilder()
                .setCustomId('moderation_cancel')
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
            const row2 = new ActionRowBuilder().addComponents(testButton, statsButton, backButton);
            const row3 = new ActionRowBuilder().addComponents(saveButton, cancelButton);
            
            await interaction.update({
                embeds: [embed],
                components: [row1, row2, row3],
                ephemeral: true
            });
            
        } catch (error) {
            console.error('Errore moderation config:', error);
            await interaction.reply({
                embeds: [createFeedbackEmbed('error', 
                    'Errore di Sistema', 
                    'Impossibile caricare la configurazione. Riprova tra poco o contatta il supporto.')],
                ephemeral: true
            });
        }
    }
};
