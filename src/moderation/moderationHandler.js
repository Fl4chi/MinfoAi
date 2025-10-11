const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

/**
 * Moderation Handler - Gestisce le funzionalità di moderazione del bot
 * Include sistemi di automod, filtri parole, log e azioni di moderazione
 */

class ModerationHandler {
  constructor() {
    this.warnings = new Map(); // Map<guildId, Map<userId, Warning[]>>
    this.automodFilters = new Map(); // Map<guildId, AutoModConfig>
    this.mutedUsers = new Map(); // Map<guildId, Set<userId>>
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
        enabled: false,
        badWords: [],
        spamProtection: false,
        inviteLinks: false,
        capsFilter: false
      });
    }
    if (!this.mutedUsers.has(guildId)) {
      this.mutedUsers.set(guildId, new Set());
    }
  }

  /**
   * Aggiunge un warn a un utente
   * @param {string} guildId - ID del server
   * @param {string} userId - ID dell'utente
   * @param {string} reason - Motivo del warn
   * @param {string} moderatorId - ID del moderatore
   */
  addWarning(guildId, userId, reason, moderatorId) {
    this.initGuild(guildId);
    const guildWarnings = this.warnings.get(guildId);
    
    if (!guildWarnings.has(userId)) {
      guildWarnings.set(userId, []);
    }

    const warning = {
      id: Date.now(),
      reason,
      moderatorId,
      timestamp: new Date(),
      active: true
    };

    guildWarnings.get(userId).push(warning);
    return {
      success: true,
      warning,
      totalWarnings: guildWarnings.get(userId).filter(w => w.active).length
    };
  }

  /**
   * Rimuove un warn da un utente
   * @param {string} guildId - ID del server
   * @param {string} userId - ID dell'utente
   * @param {number} warningId - ID del warn
   */
  removeWarning(guildId, userId, warningId) {
    this.initGuild(guildId);
    const guildWarnings = this.warnings.get(guildId);
    
    if (!guildWarnings.has(userId)) {
      return { success: false, message: 'Utente non ha warn' };
    }

    const userWarnings = guildWarnings.get(userId);
    const warning = userWarnings.find(w => w.id === warningId);

    if (!warning) {
      return { success: false, message: 'Warn non trovato' };
    }

    warning.active = false;
    return { success: true, message: 'Warn rimosso' };
  }

  /**
   * Ottiene i warn di un utente
   * @param {string} guildId - ID del server
   * @param {string} userId - ID dell'utente
   */
  getUserWarnings(guildId, userId) {
    this.initGuild(guildId);
    const guildWarnings = this.warnings.get(guildId);
    
    if (!guildWarnings.has(userId)) {
      return [];
    }

    return guildWarnings.get(userId).filter(w => w.active);
  }

  /**
   * Pulisce tutti i warn di un utente
   * @param {string} guildId - ID del server
   * @param {string} userId - ID dell'utente
   */
  clearWarnings(guildId, userId) {
    this.initGuild(guildId);
    const guildWarnings = this.warnings.get(guildId);
    
    if (!guildWarnings.has(userId)) {
      return { success: false, message: 'Utente non ha warn' };
    }

    const warnings = guildWarnings.get(userId);
    warnings.forEach(w => w.active = false);
    return { success: true, message: 'Warn puliti', count: warnings.length };
  }

  /**
   * Crea un embed con i warn di un utente
   * @param {Object} user - Utente Discord
   * @param {string} guildId - ID del server
   */
  getWarningsEmbed(user, guildId) {
    const warnings = this.getUserWarnings(guildId, user.id);

    const embed = new EmbedBuilder()
      .setTitle(`⚠️ Warn di ${user.tag}`)
      .setThumbnail(user.displayAvatarURL())
      .setColor(warnings.length === 0 ? '#00ff00' : '#ff0000')
      .addFields(
        { name: 'Warn Totali', value: warnings.length.toString(), inline: true },
        { name: 'Utente', value: `<@${user.id}>`, inline: true }
      );

    if (warnings.length > 0) {
      const warningsList = warnings.map((w, i) => 
        `**${i + 1}.** ${w.reason}\n*Moderatore:* <@${w.moderatorId}> - *Data:* ${w.timestamp.toLocaleDateString()}*`
      ).join('\n\n');
      
      embed.addFields({ name: 'Lista Warn', value: warningsList.substring(0, 1024) });
    }

    return embed;
  }

  /**
   * Configura l'automod per un server
   * @param {string} guildId - ID del server
   * @param {Object} config - Configurazione automod
   */
  setAutoModConfig(guildId, config) {
    this.initGuild(guildId);
    const currentConfig = this.automodFilters.get(guildId);
    this.automodFilters.set(guildId, { ...currentConfig, ...config });
    return { success: true, message: 'Configurazione automod aggiornata' };
  }

  /**
   * Ottiene la configurazione automod
   * @param {string} guildId - ID del server
   */
  getAutoModConfig(guildId) {
    this.initGuild(guildId);
    return this.automodFilters.get(guildId);
  }

  /**
   * Controlla un messaggio con i filtri automod
   * @param {Object} message - Messaggio Discord
   */
  async checkMessage(message) {
    if (!message.guild) return { filtered: false };

    const guildId = message.guild.id;
    this.initGuild(guildId);
    const config = this.automodFilters.get(guildId);

    if (!config.enabled) return { filtered: false };

    const content = message.content.toLowerCase();
    let reason = null;

    // Controllo parole vietate
    if (config.badWords && config.badWords.length > 0) {
      for (const word of config.badWords) {
        if (content.includes(word.toLowerCase())) {
          reason = 'Parola vietata rilevata';
          break;
        }
      }
    }

    // Controllo invite links
    if (config.inviteLinks && (content.includes('discord.gg/') || content.includes('discord.com/invite/'))) {
      reason = 'Link di invito rilevato';
    }

    // Controllo caps
    if (config.capsFilter && content.length > 10) {
      const capsCount = (content.match(/[A-Z]/g) || []).length;
      if (capsCount / content.length > 0.7) {
        reason = 'Troppo caps';
      }
    }

    if (reason) {
      try {
        await message.delete();
        return { filtered: true, reason };
      } catch (error) {
        console.error('Errore nella cancellazione del messaggio:', error);
        return { filtered: false, error: error.message };
      }
    }

    return { filtered: false };
  }

  /**
   * Muta un utente (placeholder - richiede implementazione con timeout)
   * @param {string} guildId - ID del server
   * @param {string} userId - ID dell'utente
   * @param {number} duration - Durata in minuti
   */
  muteUser(guildId, userId, duration) {
    this.initGuild(guildId);
    this.mutedUsers.get(guildId).add(userId);

    // Placeholder - implementazione futura con timeout di Discord
    setTimeout(() => {
      this.unmuteUser(guildId, userId);
    }, duration * 60 * 1000);

    return { success: true, message: `Utente mutato per ${duration} minuti` };
  }

  /**
   * Smuta un utente
   * @param {string} guildId - ID del server
   * @param {string} userId - ID dell'utente
   */
  unmuteUser(guildId, userId) {
    this.initGuild(guildId);
    const mutedSet = this.mutedUsers.get(guildId);
    
    if (!mutedSet.has(userId)) {
      return { success: false, message: 'Utente non è mutato' };
    }

    mutedSet.delete(userId);
    return { success: true, message: 'Utente smutato' };
  }

  /**
   * Verifica se un utente è mutato
   * @param {string} guildId - ID del server
   * @param {string} userId - ID dell'utente
   */
  isMuted(guildId, userId) {
    this.initGuild(guildId);
    return this.mutedUsers.get(guildId).has(userId);
  }

  /**
   * Crea un log di moderazione (placeholder)
   * @param {Object} guild - Server Discord
   * @param {string} action - Azione eseguita
   * @param {Object} target - Target dell'azione
   * @param {Object} moderator - Moderatore
   * @param {string} reason - Motivo
   */
  async logModAction(guild, action, target, moderator, reason) {
    // Placeholder - implementazione futura con canale log configurabile
    const logData = {
      action,
      target: target.tag || target.id,
      moderator: moderator.tag || moderator.id,
      reason,
      timestamp: new Date()
    };

    console.log('Mod Action:', logData);
    return { success: true, logged: true };
  }

  /**
   * Ottiene statistiche di moderazione
   * @param {string} guildId - ID del server
   */
  getStats(guildId) {
    this.initGuild(guildId);
    const guildWarnings = this.warnings.get(guildId);
    const mutedUsers = this.mutedUsers.get(guildId);

    let totalWarnings = 0;
    let usersWithWarnings = 0;

    guildWarnings.forEach((warnings) => {
      const activeWarnings = warnings.filter(w => w.active);
      if (activeWarnings.length > 0) {
        usersWithWarnings++;
        totalWarnings += activeWarnings.length;
      }
    });

    return {
      totalWarnings,
      usersWithWarnings,
      mutedUsers: mutedUsers.size,
      automodEnabled: this.automodFilters.get(guildId).enabled
    };
  }
}

module.exports = new ModerationHandler();
