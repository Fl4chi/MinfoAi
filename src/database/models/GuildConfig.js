// Mock persistent storage for guild configurations
const guildConfigs = new Map();

/**
 * GuildConfig Model - Manages server configuration with persistent mock storage
 */
class GuildConfig {
  /**
   * Get configuration for a guild
   * @param {string} guildId - Discord guild ID
   * @returns {Object} Guild configuration object
   */
  static async get(guildId) {
    if (!guildId) {
      throw new Error('Guild ID is required');
    }

    // Return existing config or create default
    if (!guildConfigs.has(guildId)) {
      guildConfigs.set(guildId, this.createDefault(guildId));
    }

    return guildConfigs.get(guildId);
  }

  /**
   * Set a configuration value for a guild
   * @param {string} guildId - Discord guild ID
   * @param {string} key - Configuration key
   * @param {any} value - Configuration value
   * @returns {Object} Updated configuration
   */
  static async set(guildId, key, value) {
    if (!guildId) {
      throw new Error('Guild ID is required');
    }

    const config = await this.get(guildId);
    config[key] = value;
    config.updatedAt = new Date();
    
    guildConfigs.set(guildId, config);
    return config;
  }

  /**
   * Set multiple configuration values at once
   * @param {string} guildId - Discord guild ID
   * @param {Object} updates - Object with key-value pairs to update
   * @returns {Object} Updated configuration
   */
  static async setMultiple(guildId, updates) {
    if (!guildId) {
      throw new Error('Guild ID is required');
    }

    const config = await this.get(guildId);
    Object.assign(config, updates);
    config.updatedAt = new Date();
    
    guildConfigs.set(guildId, config);
    return config;
  }

  /**
   * Delete a configuration key
   * @param {string} guildId - Discord guild ID
   * @param {string} key - Configuration key to delete
   * @returns {Object} Updated configuration
   */
  static async delete(guildId, key) {
    if (!guildId) {
      throw new Error('Guild ID is required');
    }

    const config = await this.get(guildId);
    delete config[key];
    config.updatedAt = new Date();
    
    guildConfigs.set(guildId, config);
    return config;
  }

  /**
   * Reset guild configuration to defaults
   * @param {string} guildId - Discord guild ID
   * @returns {Object} Reset configuration
   */
  static async reset(guildId) {
    if (!guildId) {
      throw new Error('Guild ID is required');
    }

    const config = this.createDefault(guildId);
    guildConfigs.set(guildId, config);
    return config;
  }

  /**
   * Create default configuration for a guild
   * @param {string} guildId - Discord guild ID
   * @returns {Object} Default configuration
   */
  static createDefault(guildId) {
    return {
      guildId,
      // Welcome/Goodbye settings
      welcomeChannelId: null,
      welcomeMessage: null,
      welcomeEnabled: false,
      goodbyeChannelId: null,
      goodbyeMessage: null,
      goodbyeEnabled: false,
      // Autorole settings
      autoroleEnabled: false,
      autoroles: [],
      // Verification settings
      verificationEnabled: false,
      verificationChannelId: null,
      verifiedRoleId: null,
      verificationMessage: null,
      // Logging settings
      logChannelId: null,
      logEvents: [],
      // Moderation settings
      modLogChannelId: null,
      muteRoleId: null,
      // Leveling settings
      levelingEnabled: false,
      levelUpChannelId: null,
      levelUpMessage: null,
      // Announcement settings
      announcementChannelId: null,
      // Suggestion settings
      suggestionChannelId: null,
      // Ticket settings
      ticketCategoryId: null,
      ticketLogChannelId: null,
      // Language settings
      language: 'en',
      // Timestamps
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Get all guild configurations (for debugging)
   * @returns {Map} All guild configurations
   */
  static getAll() {
    return guildConfigs;
  }

  /**
   * Clear all configurations (for testing)
   */
  static clearAll() {
    guildConfigs.clear();
  }
}

module.exports = GuildConfig;
