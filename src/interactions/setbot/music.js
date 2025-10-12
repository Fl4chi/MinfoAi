const { EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, RoleSelectMenuBuilder, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../../database/models/GuildConfig');

// UX Helper: Crea embed con guida rapida
function createHelpEmbed(title, description, fields, color = '#9B59B6', activeCategory = null) {
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
    customId: 'music',
    
    async execute(interaction) {
        // Verifica permessi
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
            return interaction.reply({
                embeds: [createFeedbackEmbed('error', 
                    'Permessi Insufficienti', 
                    'Ti serve il permesso **Gestisci Server** per configurare la musica.')],
                ephemeral: true
            });
        }
        
        try {
            // Carica config attuale
            const config = await GuildConfig.findOne({ guildId: interaction.guild.id }) || {};
            const musicConfig = config.music || {};
            
            // Check permessi bot
            const botMember = interaction.guild.members.me;
            const canConnect = botMember.permissions.has(PermissionFlagsBits.Connect);
            const canSpeak = botMember.permissions.has(PermissionFlagsBits.Speak);
            const canManageRoles = botMember.permissions.has(PermissionFlagsBits.ManageRoles);
            
            // Embed principale con highlight categoria attiva
            const embed = createHelpEmbed(
                '🎵 Configurazione Musica',
                '**Sistema Musicale Completo per il Tuo Server**\n\n' +
                'Riproduci musica di alta qualità con supporto YouTube, Spotify, SoundCloud. ' +
                'Controlli avanzati, filtri audio, code personalizzate e modalità DJ.\n\n' +
                '**📋 Funzionalità Disponibili:**\n' +
                (canConnect && canSpeak ? '✅' : '⚠️') + ' Riproduzione musica multi-piattaforma\n' +
                '✅ Controlli player avanzati (play, pause, skip, stop)\n' +
                '✅ Sistema code con limite utente personalizzabile\n' +
                '✅ Volume regolabile (0-100%)\n' +
                '✅ Filtri audio (bassboost, nightcore, vaporwave, 8D)\n' +
                (canManageRoles ? '✅' : '⚠️') + ' Modalità DJ con ruolo dedicato\n\n' +
                ((!canConnect || !canSpeak) ? 
                    '⚠️ **Attenzione**: Il bot necessita permessi Connetti + Parla nei canali vocali\n\n' : '') +
                '👇 **Seleziona cosa configurare dal menu:**',
                [
                    {
                        name: '📊 Stato Corrente',
                        value: `\`\`\`\n` +
                            `Canale Comandi: ${musicConfig.channelId ? '<#' + musicConfig.channelId + '>' : '❌ Non impostato'}\n` +
                            `Volume Default: ${musicConfig.defaultVolume || 50}%\n` +
                            `Modo DJ: ${musicConfig.djMode ? '🟢 ATTIVO' : '🔴 DISATTIVATO'}\n` +
                            `Ruolo DJ: ${musicConfig.djRoleId ? '<@&' + musicConfig.djRoleId + '>' : '❌ Non impostato'}\n` +
                            `Limite Coda: ${musicConfig.queueLimit ? musicConfig.queueLimit + ' brani/utente' : '♾️ Illimitato'}\n` +
                            `Filtri Attivi: ${musicConfig.enabledFilters?.length || 0}\n` +
                            `\`\`\``,
                        inline: false
                    },
                    {
                        name: '🎶 Piattaforme Supportate',
                        value: 'YouTube • Spotify • SoundCloud • URL Diretti',
                        inline: false
                    }
                ],
                '#9B59B6',
                'music'
            );
            
            // Menu opzioni
            const baseOptions = [
                {
                    label: '📢 Canale Comandi Musica',
                    description: 'Imposta canale dedicato per comandi /play, /skip, etc',
                    value: 'music_set_channel',
                    emoji: '📢'
                },
                {
                    label: '🔊 Volume Predefinito',
                    description: 'Imposta volume iniziale (0-100%, default: 50%)',
                    value: 'music_set_volume',
                    emoji: '🔊'
                },
                {
                    label: '🎧 Modalità DJ',
                    description: 'Richiedi ruolo DJ per usare comandi musicali',
                    value: 'music_dj_mode',
                    emoji: '🎧'
                },
                {
                    label: '🎭 Ruolo DJ',
                    description: 'Seleziona quale ruolo può controllare la musica',
                    value: 'music_dj_role',
                    emoji: '🎭',
                    requiredBotPermission: canManageRoles
                },
                {
                    label: '📋 Limite Coda',
                    description: 'Massimo brani per utente (0 = illimitato)',
                    value: 'music_queue_limit',
                    emoji: '📋'
                },
                {
                    label: '🎶 Filtri Audio',
                    description: 'Abilita filtri: bassboost, nightcore, 8D, vaporwave',
                    value: 'music_filters',
                    emoji: '🎶'
                },
                {
                    label: '⏯️ Controlli Avanzati',
                    description: 'Autoplay, loop, shuffle, salvataggio playlist',
                    value: 'music_advanced',
                    emoji: '⏯️'
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
                    description: 'Bot necessita permessi: Gestisci Ruoli',
                    value: 'music_permissions_info',
                    emoji: 'ℹ️'
                });
            }
            
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId('music_config_option')
                .setPlaceholder('🔧 Scegli cosa configurare...')
                .addOptions(availableOptions.map(opt => ({
                    label: opt.label,
                    description: opt.description,
                    value: opt.value,
                    emoji: opt.emoji
                })));
            
            // Pulsanti azione principali
            const testButton = new ButtonBuilder()
                .setCustomId('music_test')
                .setLabel('Test Player')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('▶️')
                .setDisabled(!musicConfig.channelId || !canConnect || !canSpeak);
            
            const queueButton = new ButtonBuilder()
                .setCustomId('music_view_queue')
                .setLabel('Coda')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📋');
            
            const saveButton = new ButtonBuilder()
                .setCustomId('music_save')
                .setLabel('Salva')
                .setStyle(ButtonStyle.Success)
                .setEmoji('💾')
                .setDisabled(true); // Abilitato dopo modifiche
            
            const cancelButton = new ButtonBuilder()
                .setCustomId('music_cancel')
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
            const row2 = new ActionRowBuilder().addComponents(testButton, queueButton, backButton);
            const row3 = new ActionRowBuilder().addComponents(saveButton, cancelButton);
            
            await interaction.update({
                embeds: [embed],
                components: [row1, row2, row3],
                ephemeral: true
            });
            
        } catch (error) {
            console.error('Errore music config:', error);
            await interaction.reply({
                embeds: [createFeedbackEmbed('error', 
                    'Errore di Sistema', 
                    'Impossibile caricare la configurazione. Riprova tra poco o contatta il supporto.')],
                ephemeral: true
            });
        }
    }
};
