// Database module for MinfoAi
// Provides guild configuration storage using MongoDB
const GuildConfig = require('./models/GuildConfig');

/**
 * Get guild configuration
 * @param {string} guildId - The guild ID
 * @returns {Promise<Object>} Guild configuration object
 */
async function getGuildConfig(guildId) {
  try {
    return await GuildConfig.getGuildConfig(guildId);
  } catch (error) {
    console.error(`Error getting guild config for ${guildId}:`, error);
    throw error;
  }
}

/**
 * Update guild configuration
 * @param {string} guildId - The guild ID
 * @param {Object} config - Configuration object to update
 * @returns {Promise<Object>} Updated configuration
 */
async function updateGuildConfig(guildId, config) {
  try {
    return await GuildConfig.updateGuildConfig(guildId, config);
  } catch (error) {
    console.error(`Error updating guild config for ${guildId}:`, error);
    throw error;
  }
}

/**
 * Delete guild configuration
 * @param {string} guildId - The guild ID
 * @returns {Promise<boolean>} True if deleted, false otherwise
 */
async function deleteGuildConfig(guildId) {
  try {
    const result = await GuildConfig.deleteOne({ guildId });
    return result.deletedCount > 0;
  } catch (error) {
    console.error(`Error deleting guild config for ${guildId}:`, error);
    throw error;
  }
}

/**
 * Check if guild has configuration
 * @param {string} guildId - The guild ID
 * @returns {Promise<boolean>} True if guild has config
 */
async function hasGuildConfig(guildId) {
  try {
    const config = await GuildConfig.findOne({ guildId });
    return config !== null;
  } catch (error) {
    console.error(`Error checking guild config for ${guildId}:`, error);
    throw error;
  }
}

module.exports = {
  getGuildConfig,
  updateGuildConfig,
  deleteGuildConfig,
  hasGuildConfig
};
