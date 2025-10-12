const { EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../database/models/GuildConfig');

// UX Helper: Crea embed con guida rapida
function createHelpEmbed(title, description, fields, color = '#FF4444', activeCategory = null) {
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
    customId: 'goodbye',
    
    async execute(interaction) {
        // Verifica permessi
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({
                embeds: [createFeedbackEmbed('error', 
                    'Permessi Insufficienti', 
                    'Ti serve il permesso **Gestisci Server** per configurare i messaggi di addio.')],
                ephemeral: true
            });
        }
        
        try {
            // Carica config attuale
            const config = await GuildConfig.findOne({ guildId: interaction.guild.id }) || {};
            const goodbyeConfig = config.goodbye || {};
            
            // Check permessi bot
            const botMember = interaction.guild.members.me;
            const canSendMessages = botMember.permissions.has(PermissionFlagsBits.SendMessages);
            const canEmbedLinks = botMember.permissions.has(PermissionFlagsBits.EmbedLinks);
            
            // Embed principale con highlight categoria attiva
            const embed = createHelpEmbed(
                '👋 Configurazione Addio',
                '**Sistema di Messaggi Addio Personalizzati**\n\n' +
                'Saluta i membri che lasciano il server con messaggi personalizzati, ' +
                'embed eleganti e statistiche in tempo reale.\n\n' +
                '**📋 Funzionalità Disponibili:**\n' +
                (canSendMessages ? '✅' : '⚠️') + ' Messaggi di addio personalizzati\n' +
                (canEmbedLinks ? '✅' : '⚠️') + ' Embed premium con colori custom\n' +
                '✅ Statistiche membri aggiornate\n' +
                '✅ Variabili dinamiche {user}, {server}, {count}\n' +
                '✅ Anteprima live del messaggio\n' +
                '✅ Canale dedicato per gli addii\n\n' +
                ((!canSendMessages || !canEmbedLinks) ? 
                    '⚠️ **Attenzione**: Il bot necessita permessi aggiuntivi\n\n' : '') +
                '👇 **Seleziona cosa configurare dal menu:**',
                [
                    {
                        name: '📊 Stato Corrente',
                        value: `\`\`\`\n` +
                            `Sistema: ${goodbyeConfig.enabled ? '🟢 ATTIVO' : '🔴 DISATTIVATO'}\n` +
                            `Canale: ${goodbyeConfig.channelId ? '<#' + goodbyeConfig.channelId + '>' : '❌ Non impostato'}\n` +
                            `Messaggio: ${goodbyeConfig.message ? 'Personalizzato' : 'Default'}\n` +
                            `Colore Embed: ${goodbyeConfig.embedColor || '#FF4444 (default)'}\n` +
                            `Statistiche: ${goodbyeConfig.showStats ? '✅ Visibili' : '❌ Nascoste'}\n` +
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
                goodbyeConfig.embedColor || '#FF4444',
                'goodbye'
            );
            
            // Menu opzioni
            const baseOptions = [
                {
                    label: '📢 Canale Addii',
                    description: 'Imposta dove inviare i messaggi di addio',
                    value: 'goodbye_set_channel',
                    emoji: '📢',
                    requiredBotPermission: canSendMessages
                },
                {
                    label: '✏️ Messaggio Custom',
                    description: 'Personalizza testo e contenuto del messaggio',
                    value: 'goodbye_set_message',
                    emoji: '✏️'
                },
                {
                    label: '🎨 Colore Embed',
                    description: 'Scegli il colore dell\'embed (es. #FF4444)',
                    value: 'goodbye_set_color',
                    emoji: '🎨',
                    requiredBotPermission: canEmbedLinks
                },
                {
                    label: '📊 Statistiche Membri',
                    description: 'Mostra/nascondi conteggio membri nel messaggio',
                    value: 'goodbye_stats',
                    emoji: '📊'
                },
                {
                    label: '👁️ Anteprima Live',
                    description: 'Visualizza come apparirà il messaggio di addio',
                    value: 'goodbye_preview',
                    emoji: '👁️'
                },
                {
                    label: '📌 Guida Variabili',
                    description: 'Lista completa variabili per messaggi dinamici',
                    value: 'goodbye_variables',
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
                    description: 'Bot necessita permessi: Invia Messaggi, Embed',
                    value: 'goodbye_permissions_info',
                    emoji: 'ℹ️'
                });
            }
            
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('goodbye_config_option')
                .setPlaceholder('🔧 Scegli cosa configurare...')
                .addOptions(availableOptions.map(opt => ({
                    label: opt.label,
                    description: opt.description,
                    value: opt.value,
                    emoji: opt.emoji
                })));
            
            // Pulsanti azione principali
            const toggleButton = new ButtonBuilder()
                .setCustomId('goodbye_toggle')
                .setLabel(goodbyeConfig.enabled ? 'Disabilita Sistema' : 'Abilita Sistema')
                .setStyle(goodbyeConfig.enabled ? ButtonStyle.Danger : ButtonStyle.Success)
                .setEmoji(goodbyeConfig.enabled ? '🔴' : '🟢');
            
            const previewButton = new ButtonBuilder()
                .setCustomId('goodbye_preview')
                .setLabel('Anteprima')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('👁️')
                .setDisabled(!goodbyeConfig.channelId || !canSendMessages);
            
            const saveButton = new ButtonBuilder()
                .setCustomId('goodbye_save')
                .setLabel('Salva')
                .setStyle(ButtonStyle.Success)
                .setEmoji('💾')
                .setDisabled(true); // Abilitato dopo modifiche
            
            const cancelButton = new ButtonBuilder()
                .setCustomId('goodbye_cancel')
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
            console.error('Errore goodbye config:', error);
            await interaction.reply({
                embeds: [createFeedbackEmbed('error', 
                    'Errore di Sistema', 
                    'Impossibile caricare la configurazione. Riprova tra poco o contatta il supporto.')],
                ephemeral: true
            });
        }
    }
};
