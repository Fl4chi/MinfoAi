// Mock database module for MinfoAi
// Provides basic guild configuration storage

const guildConfigs = new Map();

/**
 * Get guild configuration
 * @param {string} guildId - The guild ID
 * @returns {Object} Guild configuration object
 */
function getGuildConfig(guildId) {
  if (!guildConfigs.has(guildId)) {
    // Return default configuration
    return {
      prefix: '!',
      language: 'en',
      welcomeChannel: null,
      logChannel: null,
      musicChannel: null,
      autoRole: null,
      moderationEnabled: false,
      antiSpam: false,
      autoMod: false
    };
  }
  return guildConfigs.get(guildId);
}

/**
 * Update guild configuration
 * @param {string} guildId - The guild ID
 * @param {Object} config - Configuration object to update
 * @returns {Promise<Object>} Updated configuration
 */
async function updateGuildConfig(guildId, config) {
  const currentConfig = getGuildConfig(guildId);
  const updatedConfig = { ...currentConfig, ...config };
  guildConfigs.set(guildId, updatedConfig);
  return updatedConfig;
}

/**
 * Delete guild configuration
 * @param {string} guildId - The guild ID
 * @returns {boolean} True if deleted, false otherwise
 */
function deleteGuildConfig(guildId) {
  return guildConfigs.delete(guildId);
}

/**
 * Check if guild has configuration
 * @param {string} guildId - The guild ID
 * @returns {boolean} True if guild has config
 */
function hasGuildConfig(guildId) {
  return guildConfigs.has(guildId);
}

module.exports = {
  getGuildConfig,
  updateGuildConfig,
  deleteGuildConfig,
  hasGuildConfig
};
