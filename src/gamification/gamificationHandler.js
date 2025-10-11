const { EmbedBuilder } = require('discord.js');
const { getDb } = require('../database/database');
const logger = require('../utils/logger');

/**
 * Gestisce il sistema di gamification con XP, leaderboard e reward
 */
class GamificationHandler {
  constructor() {
    this.xpPerMessage = 5;
    this.xpPerQuiz = 50;
    this.xpPerQuest = 100;
    this.cooldown = 60000; // 1 minuto cooldown per XP da messaggi
    this.userCooldowns = new Map();
  }

  /**
   * Calcola il livello basato sull'XP
   * @param {number} xp - Esperienza totale
   * @returns {number} Livello calcolato
   */
  calculateLevel(xp) {
    return Math.floor(Math.sqrt(xp / 100));
  }

  /**
   * Calcola XP necessari per il prossimo livello
   * @param {number} currentLevel - Livello attuale
   * @returns {number} XP necessari
   */
  xpForNextLevel(currentLevel) {
    return Math.pow(currentLevel + 1, 2) * 100;
  }

  /**
   * Aggiunge XP a un utente
   * @param {string} userId - ID dell'utente
   * @param {string} guildId - ID del server
   * @param {number} amount - Quantità di XP da aggiungere
   * @param {string} reason - Motivazione
   * @returns {Promise<Object>} Risultato con livello precedente e nuovo
   */
  async addXP(userId, guildId, amount, reason = 'activity') {
    try {
      const db = getDb();
      const key = `${userId}-${guildId}`;

      // Controlla cooldown solo per messaggi
      if (reason === 'message') {
        const now = Date.now();
        const lastXP = this.userCooldowns.get(key);
        if (lastXP && now - lastXP < this.cooldown) {
          return null; // Cooldown attivo
        }
        this.userCooldowns.set(key, now);
      }

      // Recupera dati utente
      let userData = await db.get(`SELECT * FROM gamification WHERE userId = ? AND guildId = ?`, [userId, guildId]);

      if (!userData) {
        // Crea nuovo record
        await db.run(
          `INSERT INTO gamification (userId, guildId, xp, level, lastXpGain) VALUES (?, ?, ?, ?, ?)`,
          [userId, guildId, amount, this.calculateLevel(amount), Date.now()]
        );
        
        logger.info(`Gamification: Nuovo utente ${userId} nel server ${guildId} con ${amount} XP (${reason})`);
        
        return {
          oldLevel: 0,
          newLevel: this.calculateLevel(amount),
          xp: amount,
          leveledUp: this.calculateLevel(amount) > 0
        };
      }

      // Aggiorna XP
      const newXP = userData.xp + amount;
      const oldLevel = this.calculateLevel(userData.xp);
      const newLevel = this.calculateLevel(newXP);

      await db.run(
        `UPDATE gamification SET xp = ?, level = ?, lastXpGain = ? WHERE userId = ? AND guildId = ?`,
        [newXP, newLevel, Date.now(), userId, guildId]
      );

      logger.info(`Gamification: ${userId} guadagna ${amount} XP (${reason}) - Livello ${oldLevel} -> ${newLevel}`);

      return {
        oldLevel,
        newLevel,
        xp: newXP,
        leveledUp: newLevel > oldLevel
      };
    } catch (error) {
      logger.error(`Errore aggiunta XP per utente ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Traccia XP da messaggio
   * @param {Message} message - Messaggio Discord
   * @returns {Promise<Object|null>} Risultato o null se in cooldown
   */
  async trackMessageXP(message) {
    if (message.author.bot || !message.guild) return null;
    
    try {
      const result = await this.addXP(
        message.author.id,
        message.guild.id,
        this.xpPerMessage,
        'message'
      );

      return result;
    } catch (error) {
      logger.error('Errore tracking XP messaggio:', error);
      return null;
    }
  }

  /**
   * Ottiene la leaderboard del server
   * @param {string} guildId - ID del server
   * @param {number} limit - Numero di utenti da recuperare
   * @returns {Promise<Array>} Classifica ordinata
   */
  async getLeaderboard(guildId, limit = 10) {
    try {
      const db = getDb();
      const leaderboard = await db.all(
        `SELECT userId, xp, level FROM gamification 
         WHERE guildId = ? 
         ORDER BY xp DESC 
         LIMIT ?`,
        [guildId, limit]
      );

      logger.info(`Leaderboard recuperata per server ${guildId}: ${leaderboard.length} utenti`);
      return leaderboard;
    } catch (error) {
      logger.error('Errore recupero leaderboard:', error);
      throw error;
    }
  }

  /**
   * Ottiene i dati gamification di un utente
   * @param {string} userId - ID dell'utente
   * @param {string} guildId - ID del server
   * @returns {Promise<Object|null>} Dati utente
   */
  async getUserData(userId, guildId) {
    try {
      const db = getDb();
      const userData = await db.get(
        `SELECT * FROM gamification WHERE userId = ? AND guildId = ?`,
        [userId, guildId]
      );
      
      return userData || null;
    } catch (error) {
      logger.error(`Errore recupero dati utente ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Crea embed per leaderboard
   * @param {Guild} guild - Server Discord
   * @param {Array} leaderboard - Dati leaderboard
   * @returns {Promise<EmbedBuilder>} Embed della classifica
   */
  async createLeaderboardEmbed(guild, leaderboard) {
    const embed = new EmbedBuilder()
      .setColor('#FFD700')
      .setTitle(`🏆 Leaderboard - ${guild.name}`)
      .setTimestamp();

    if (leaderboard.length === 0) {
      embed.setDescription('Nessun dato disponibile. Inizia a partecipare per guadagnare XP!');
      return embed;
    }

    const medals = ['🥇', '🥈', '🥉'];
    let description = '';

    for (let i = 0; i < leaderboard.length; i++) {
      const user = leaderboard[i];
      const member = await guild.members.fetch(user.userId).catch(() => null);
      const username = member ? member.user.tag : `User ${user.userId}`;
      const medal = medals[i] || `${i + 1}.`;
      
      description += `${medal} **${username}**\n`;
      description += `   Level ${user.level} | ${user.xp.toLocaleString()} XP\n\n`;
    }

    embed.setDescription(description);
    return embed;
  }

  /**
   * Crea embed per level up
   * @param {User} user - Utente Discord
   * @param {number} newLevel - Nuovo livello
   * @param {number} xp - XP totali
   * @returns {EmbedBuilder} Embed level up
   */
  createLevelUpEmbed(user, newLevel, xp) {
    const nextLevelXP = this.xpForNextLevel(newLevel);
    
    return new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('🎉 Level Up!')
      .setDescription(`Congratulazioni ${user}! Hai raggiunto il **Livello ${newLevel}**!`)
      .addFields(
        { name: '📊 XP Totali', value: xp.toLocaleString(), inline: true },
        { name: '🎯 Prossimo Livello', value: `${nextLevelXP.toLocaleString()} XP`, inline: true }
      )
      .setThumbnail(user.displayAvatarURL())
      .setTimestamp();
  }

  /**
   * Assegna ricompensa ruolo per livello
   * @param {GuildMember} member - Membro del server
   * @param {number} level - Livello raggiunto
   * @param {Object} roleRewards - Configurazione reward {level: roleId}
   * @returns {Promise<string|null>} ID ruolo assegnato o null
   */
  async assignRoleReward(member, level, roleRewards) {
    try {
      if (!roleRewards || Object.keys(roleRewards).length === 0) {
        return null;
      }

      // Trova il ruolo appropriato per questo livello
      const eligibleLevels = Object.keys(roleRewards)
        .map(Number)
        .filter(lvl => lvl <= level)
        .sort((a, b) => b - a);

      if (eligibleLevels.length === 0) return null;

      const targetLevel = eligibleLevels[0];
      const roleId = roleRewards[targetLevel];
      const role = member.guild.roles.cache.get(roleId);

      if (!role) {
        logger.warn(`Ruolo reward ${roleId} non trovato nel server ${member.guild.id}`);
        return null;
      }

      // Verifica se l'utente ha già il ruolo
      if (member.roles.cache.has(roleId)) {
        return null;
      }

      // Assegna il ruolo
      await member.roles.add(role);
      logger.info(`Ruolo reward "${role.name}" assegnato a ${member.user.tag} per livello ${level}`);
      
      return roleId;
    } catch (error) {
      logger.error(`Errore assegnazione ruolo reward a ${member.user.tag}:`, error);
      return null;
    }
  }

  /**
   * Resetta XP di un utente
   * @param {string} userId - ID dell'utente
   * @param {string} guildId - ID del server
   * @returns {Promise<boolean>} Successo operazione
   */
  async resetUserXP(userId, guildId) {
    try {
      const db = getDb();
      await db.run(
        `DELETE FROM gamification WHERE userId = ? AND guildId = ?`,
        [userId, guildId]
      );
      
      logger.info(`XP resettati per utente ${userId} nel server ${guildId}`);
      return true;
    } catch (error) {
      logger.error(`Errore reset XP utente ${userId}:`, error);
      return false;
    }
  }

  /**
   * Ottiene statistiche globali del server
   * @param {string} guildId - ID del server
   * @returns {Promise<Object>} Statistiche
   */
  async getServerStats(guildId) {
    try {
      const db = getDb();
      const stats = await db.get(
        `SELECT 
          COUNT(*) as totalUsers,
          SUM(xp) as totalXP,
          MAX(level) as maxLevel,
          AVG(level) as avgLevel
         FROM gamification 
         WHERE guildId = ?`,
        [guildId]
      );
      
      return {
        totalUsers: stats.totalUsers || 0,
        totalXP: stats.totalXP || 0,
        maxLevel: stats.maxLevel || 0,
        avgLevel: Math.round(stats.avgLevel || 0)
      };
    } catch (error) {
      logger.error('Errore recupero statistiche server:', error);
      throw error;
    }
  }
}

module.exports = new GamificationHandler();
