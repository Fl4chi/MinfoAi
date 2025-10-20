// src/database/db.js

// Mappa in memoria per configs guild (fai refactoring a MongoDB quando vuoi)
const configs = new Map();
/**
 * Salva la configurazione completa per la guild (override o nuova).
 * @param {string} guildId - ID della guild Discord
 * @param {object} config - L'oggetto di configurazione della guild
 */
function setGuildConfig(guildId, config) {
    configs.set(guildId, config);
}
/**
 * Recupera la configurazione corrente per la guild. Se non esiste, ritorna null.
 * @param {string} guildId - ID della guild Discord
 * @returns {object|null}
 */
function getGuildConfig(guildId) {
    return configs.get(guildId) || null;
}
// Export corretto per js
module.exports = { setGuildConfig, getGuildConfig };
