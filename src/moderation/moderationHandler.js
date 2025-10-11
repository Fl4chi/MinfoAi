const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

/**
 * Moderation Handler - Gestisce le funzionalità di moderazione del bot
 * Include sistemi di automod, filtri parole, log, anti-spam/flood e azioni di moderazione
 */
class ModerationHandler {
  constructor() {
    this.warnings = new Map(); // Map<guildId, Map<userId, warnings[]>>
    this.automodFilters = new Map(); // Map<guildId, automodConfig>
    this.mutedUsers = new Map(); // Map<guildId, Set<userId>>
    this.spamTracker = new Map(); // Map<userId, messageData[]>
    this.badWords = ['spam', 'insulto', 'parolaccia']; // Lista parole da filtrare
  }

  /**
   * Inizializza i dati di moderazione per un server
   * @param {string} guildId - ID del server
   */
  initGuild(guildId) {
    if (!this.warnings.has(guildId)) {
      this.warnings.set(guildId, new Map());
    }
    if (!this.automodFilters.has(guildId)) {
      this.automodFilters.set(guildId, {
        enabled: true,
        badWords: this.badWords,
        spamProtection: true,
        inviteLinks: true,
        capsFilter: true
      });
    }
    if (!this.mutedUsers.has(guildId)) {
      this.mutedUsers.set(guildId, new Set());
    }
  }

  /**
   * Anti-spam/flood protection
   * @param {Message} message - Il messaggio da controllare
   * @returns {boolean} - True se è spam
   */
  checkSpam(message) {
    const userId = message.author.id;
    const now = Date.now();
    const maxMessages = 5; // Max messaggi
    const timeWindow = 5000; // in 5 secondi

    if (!this.spamTracker.has(userId)) {
      this.spamTracker.set(userId, []);
    }

    const userMessages = this.spamTracker.get(userId);
    
    // Rimuovi messaggi vecchi
    const recentMessages = userMessages.filter(time => now - time < timeWindow);
    recentMessages.push(now);
    this.spamTracker.set(userId, recentMessages);

    // Controlla se è spam
    if (recentMessages.length > maxMessages) {
      return true;
    }

    return false;
  }

  /**
   * Filtra parole proibite
   * @param {string} content - Il contenuto da controllare
   * @param {string} guildId - ID del server
   * @returns {boolean} - True se contiene parole proibite
   */
  checkBadWords(content, guildId) {
    const config = this.automodFilters.get(guildId);
    if (!config || !config.enabled) return false;

    const lowerContent = content.toLowerCase();
    return config.badWords.some(word => lowerContent.includes(word.toLowerCase()));
  }

  /**
   * Controlla messaggi con automod
   * @param {Message} message - Il messaggio da controllare
   * @returns {Object} - Risultato del controllo
   */
  async checkMessage(message) {
    if (message.author.bot) return { action: 'none' };

    const guildId = message.guild.id;
    this.initGuild(guildId);

    const config = this.automodFilters.get(guildId);
    if (!config || !config.enabled) return { action: 'none' };

    // Controlla spam
    if (config.spamProtection && this.checkSpam(message)) {
      return { action: 'delete', reason: 'Spam/Flood rilevato' };
    }

    // Controlla parole proibite
    if (this.checkBadWords(message.content, guildId)) {
      return { action: 'delete', reason: 'Parola proibita rilevata' };
    }

    // Controlla link inviti
    if (config.inviteLinks && /(discord\.gg|discord\.com\/invite)/i.test(message.content)) {
      return { action: 'delete', reason: 'Link di invito non autorizzato' };
    }

    // Controlla CAPS eccessivo
    if (config.capsFilter) {
      const capsPercentage = (message.content.replace(/[^A-Z]/g, '').length / message.content.length) * 100;
      if (message.content.length > 10 && capsPercentage > 70) {
        return { action: 'delete', reason: 'CAPS eccessivo' };
      }
    }

    return { action: 'none' };
  }

  /**
   * Aggiunge un warning a un utente
   * @param {string} guildId - ID del server
   * @param {string} userId - ID dell'utente
   * @param {string} reason - Motivo del warning
   * @param {string} moderatorId - ID del moderatore
   */
  addWarning(guildId, userId, reason, moderatorId) {
    this.initGuild(guildId);

    const guildWarnings = this.warnings.get(guildId);
    if (!guildWarnings.has(userId)) {
      guildWarnings.set(userId, []);
    }

    const userWarnings = guildWarnings.get(userId);
    userWarnings.push({
      reason,
      moderatorId,
      timestamp: Date.now()
    });

    this.logModAction(guildId, 'warning', userId, moderatorId, reason);
    return userWarnings.length;
  }

  /**
   * Ottiene i warning di un utente
   * @param {string} guildId - ID del server
   * @param {string} userId - ID dell'utente
   * @returns {Array} - Lista dei warning
   */
  getWarnings(guildId, userId) {
    this.initGuild(guildId);
    const guildWarnings = this.warnings.get(guildId);
    return guildWarnings.get(userId) || [];
  }

  /**
   * Rimuove un warning da un utente
   * @param {string} guildId - ID del server
   * @param {string} userId - ID dell'utente
   * @param {number} index - Indice del warning da rimuovere
   */
  removeWarning(guildId, userId, index) {
    this.initGuild(guildId);
    const guildWarnings = this.warnings.get(guildId);
    const userWarnings = guildWarnings.get(userId);

    if (userWarnings && userWarnings[index]) {
      userWarnings.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Ban utente
   * @param {Guild} guild - Il server
   * @param {string} userId - ID dell'utente
   * @param {string} reason - Motivo del ban
   * @param {string} moderatorId - ID del moderatore
   */
  async banUser(guild, userId, reason, moderatorId) {
    try {
      await guild.members.ban(userId, { reason });
      this.logModAction(guild.id, 'ban', userId, moderatorId, reason);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Kick utente
   * @param {Guild} guild - Il server
   * @param {string} userId - ID dell'utente
   * @param {string} reason - Motivo del kick
   * @param {string} moderatorId - ID del moderatore
   */
  async kickUser(guild, userId, reason, moderatorId) {
    try {
      const member = await guild.members.fetch(userId);
      await member.kick(reason);
      this.logModAction(guild.id, 'kick', userId, moderatorId, reason);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Mute utente (timeout)
   * @param {Guild} guild - Il server
   * @param {string} userId - ID dell'utente
   * @param {number} duration - Durata in millisecondi
   * @param {string} reason - Motivo del mute
   * @param {string} moderatorId - ID del moderatore
   */
  async muteUser(guild, userId, duration, reason, moderatorId) {
    try {
      const member = await guild.members.fetch(userId);
      await member.timeout(duration, reason);
      
      const guildMuted = this.mutedUsers.get(guild.id);
      guildMuted.add(userId);

      this.logModAction(guild.id, 'mute', userId, moderatorId, reason);

      // Auto-unmute dopo durata
      setTimeout(() => {
        guildMuted.delete(userId);
      }, duration);

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Unmute utente
   * @param {Guild} guild - Il server
   * @param {string} userId - ID dell'utente
   * @param {string} moderatorId - ID del moderatore
   */
  async unmuteUser(guild, userId, moderatorId) {
    try {
      const member = await guild.members.fetch(userId);
      await member.timeout(null);

      const guildMuted = this.mutedUsers.get(guild.id);
      guildMuted.delete(userId);

      this.logModAction(guild.id, 'unmute', userId, moderatorId, 'Unmute');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Comando staff /me - Messaggio come bot con crediti
   * @param {Message} message - Il messaggio originale
   * @param {string} content - Il contenuto da inviare
   */
  async staffMe(message, content) {
    if (!message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return { success: false, error: 'Permessi insufficienti' };
    }

    try {
      const embed = new EmbedBuilder()
        .setDescription(content)
        .setFooter({ text: `Inviato da ${message.author.tag}`, iconURL: message.author.displayAvatarURL() })
        .setColor('#5865F2')
        .setTimestamp();

      await message.channel.send({ embeds: [embed] });
      await message.delete();

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Log azione di moderazione
   * @param {string} guildId - ID del server
   * @param {string} action - Tipo di azione
   * @param {string} userId - ID dell'utente
   * @param {string} moderatorId - ID del moderatore
   * @param {string} reason - Motivo
   */
  logModAction(guildId, action, userId, moderatorId, reason) {
    console.log(`[MODERATION] ${guildId} | ${action.toUpperCase()} | User: ${userId} | Mod: ${moderatorId} | Reason: ${reason}`);
    
    // Qui si può implementare il salvataggio su database o invio a canale log
  }

  /**
   * Configura i filtri automod
   * @param {string} guildId - ID del server
   * @param {Object} config - Configurazione
   */
  setAutomodConfig(guildId, config) {
    this.initGuild(guildId);
    const currentConfig = this.automodFilters.get(guildId);
    this.automodFilters.set(guildId, { ...currentConfig, ...config });
  }

  /**
   * Aggiunge parola alla blacklist
   * @param {string} guildId - ID del server
   * @param {string} word - Parola da aggiungere
   */
  addBadWord(guildId, word) {
    this.initGuild(guildId);
    const config = this.automodFilters.get(guildId);
    if (!config.badWords.includes(word)) {
      config.badWords.push(word);
      return true;
    }
    return false;
  }

  /**
   * Rimuove parola dalla blacklist
   * @param {string} guildId - ID del server
   * @param {string} word - Parola da rimuovere
   */
  removeBadWord(guildId, word) {
    this.initGuild(guildId);
    const config = this.automodFilters.get(guildId);
    const index = config.badWords.indexOf(word);
    if (index > -1) {
      config.badWords.splice(index, 1);
      return true;
    }
    return false;
  }
}

module.exports = ModerationHandler;
