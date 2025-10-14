const configs = new Map();

function setGuildConfig(guildId, config) {
    configs.set(guildId, config);
}

function getGuildConfig(guildId) {
    return configs.get(guildId) || null;
}

module.exports = { setGuildConfig, getGuildConfig };
