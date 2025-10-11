const { EmbedBuilder, PermissionsBitField } = require('discord.js');
const fs = require('fs');
const path = require('path');

/**
 * Handler per la gestione degli addii (membri che lasciano il server)
 * Supporta messaggi embed dinamici, configurazione canale e test anteprima
 */
class GoodbyeHandler {
    constructor() {
        this.configPath = path.join(__dirname, '../config/goodbye.json');
        this.config = this.loadConfig();
    }

    /**
     * Carica la configurazione degli addii
     */
    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                const data = fs.readFileSync(this.configPath, 'utf8');
                return JSON.parse(data);
            }
        } catch (error) {
            console.error('Errore nel caricamento config addii:', error);
        }
        
        // Configurazione default
        return {
            enabled: false,
            channelId: null,
            message: {
                title: '👋 Addio {username}',
                description: 'Grazie per aver fatto parte della nostra community!',
                color: '#ff6b6b',
                footer: 'Ci mancherai! 💔',
                thumbnail: true, // usa avatar utente
                timestamp: true
            },
            mentions: {
                roles: [], // ruoli da pingare
                users: [] // utenti da pingare
            }
        };
    }

    /**
     * Salva la configurazione
     */
    saveConfig() {
        try {
            const configDir = path.dirname(this.configPath);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 4));
            return true;
        } catch (error) {
            console.error('Errore nel salvataggio config addii:', error);
            return false;
        }
    }

    /**
     * Gestisce l'evento guildMemberRemove
     */
    async handleMemberLeave(member) {
        try {
            if (!this.config.enabled || !this.config.channelId) {
                return;
            }

            const channel = member.guild.channels.cache.get(this.config.channelId);
            if (!channel) {
                console.error('Canale addii non trovato:', this.config.channelId);
                return;
            }

            // Verifica permessi bot
            if (!channel.permissionsFor(member.guild.members.me).has([
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.EmbedLinks
            ])) {
                console.error('Permessi insufficienti per canale addii');
                return;
            }

            const embed = this.createGoodbyeEmbed(member);
            const messageContent = this.buildMessageContent();

            await channel.send({
                content: messageContent || undefined,
                embeds: [embed]
            });

        } catch (error) {
            console.error('Errore nell\'invio messaggio addio:', error);
        }
    }

    /**
     * Crea l'embed dinamico per l'addio
     */
    createGoodbyeEmbed(member) {
        const config = this.config.message;
        const embed = new EmbedBuilder();

        // Sostituzioni dinamiche
        const replacements = {
            '{username}': member.user.username,
            '{displayName}': member.displayName || member.user.username,
            '{mention}': `<@${member.user.id}>`,
            '{tag}': member.user.tag,
            '{id}': member.user.id,
            '{guildName}': member.guild.name,
            '{memberCount}': member.guild.memberCount.toString(),
            '{joinedDate}': member.joinedAt ? member.joinedAt.toLocaleDateString('it-IT') : 'Sconosciuto'
        };

        // Applica sostituzioni al titolo
        let title = config.title || 'Addio {username}';
        Object.entries(replacements).forEach(([placeholder, value]) => {
            title = title.replace(new RegExp(placeholder, 'g'), value);
        });
        embed.setTitle(title);

        // Applica sostituzioni alla descrizione
        let description = config.description || 'Grazie per aver fatto parte della nostra community!';
        Object.entries(replacements).forEach(([placeholder, value]) => {
            description = description.replace(new RegExp(placeholder, 'g'), value);
        });
        embed.setDescription(description);

        // Colore
        if (config.color) {
            embed.setColor(config.color);
        }

        // Footer
        if (config.footer) {
            let footer = config.footer;
            Object.entries(replacements).forEach(([placeholder, value]) => {
                footer = footer.replace(new RegExp(placeholder, 'g'), value);
            });
            embed.setFooter({ text: footer });
        }

        // Thumbnail (avatar utente)
        if (config.thumbnail) {
            embed.setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }));
        }

        // Timestamp
        if (config.timestamp) {
            embed.setTimestamp();
        }

        return embed;
    }

    /**
     * Costruisce il contenuto del messaggio (mention)
     */
    buildMessageContent() {
        const mentions = [];
        
        // Aggiungi ruoli da pingare
        if (this.config.mentions.roles && this.config.mentions.roles.length > 0) {
            this.config.mentions.roles.forEach(roleId => {
                mentions.push(`<@&${roleId}>`);
            });
        }

        // Aggiungi utenti da pingare
        if (this.config.mentions.users && this.config.mentions.users.length > 0) {
            this.config.mentions.users.forEach(userId => {
                mentions.push(`<@${userId}>`);
            });
        }

        return mentions.length > 0 ? mentions.join(' ') : null;
    }

    /**
     * Imposta il canale per gli addii
     */
    setGoodbyeChannel(channelId) {
        this.config.channelId = channelId;
        return this.saveConfig();
    }

    /**
     * Abilita/disabilita gli addii
     */
    setEnabled(enabled) {
        this.config.enabled = enabled;
        return this.saveConfig();
    }

    /**
     * Aggiorna la configurazione del messaggio
     */
    updateMessageConfig(newConfig) {
        this.config.message = { ...this.config.message, ...newConfig };
        return this.saveConfig();
    }

    /**
     * Aggiorna le mention
     */
    updateMentions(roles = [], users = []) {
        this.config.mentions.roles = roles;
        this.config.mentions.users = users;
        return this.saveConfig();
    }

    /**
     * Test anteprima - simula un addio per testing
     */
    async testPreview(interaction, member = null) {
        try {
            const targetMember = member || interaction.member;
            const embed = this.createGoodbyeEmbed(targetMember);
            const messageContent = this.buildMessageContent();

            await interaction.reply({
                content: `**🔍 ANTEPRIMA MESSAGGIO ADDIO:**\n${messageContent || '*(Nessuna mention)*'}`,
                embeds: [embed],
                ephemeral: true
            });

        } catch (error) {
            console.error('Errore nel test anteprima addio:', error);
            await interaction.reply({
                content: '❌ Errore nella generazione dell\'anteprima',
                ephemeral: true
            });
        }
    }

    /**
     * Ottieni informazioni di stato
     */
    getStatus(guild) {
        const channel = this.config.channelId ? 
            guild.channels.cache.get(this.config.channelId) : null;
        
        return {
            enabled: this.config.enabled,
            channelId: this.config.channelId,
            channelName: channel ? channel.name : 'Non configurato',
            channelExists: !!channel,
            mentionRoles: this.config.mentions.roles.length,
            mentionUsers: this.config.mentions.users.length
        };
    }

    /**
     * Reset configurazione
     */
    resetConfig() {
        this.config = {
            enabled: false,
            channelId: null,
            message: {
                title: '👋 Addio {username}',
                description: 'Grazie per aver fatto parte della nostra community!',
                color: '#ff6b6b',
                footer: 'Ci mancherai! 💔',
                thumbnail: true,
                timestamp: true
            },
            mentions: {
                roles: [],
                users: []
            }
        };
        return this.saveConfig();
    }

    /**
     * Validazione configurazione
     */
    validateConfig() {
        const errors = [];
        
        if (this.config.enabled && !this.config.channelId) {
            errors.push('Canale addii non configurato');
        }
        
        if (!this.config.message.title || this.config.message.title.trim() === '') {
            errors.push('Titolo messaggio vuoto');
        }
        
        if (!this.config.message.description || this.config.message.description.trim() === '') {
            errors.push('Descrizione messaggio vuota');
        }
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }
}

module.exports = GoodbyeHandler;
