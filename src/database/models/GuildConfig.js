const mongoose = require('mongoose');

const guildConfigSchema = new mongoose.Schema({
  guildId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Welcome/Goodbye settings
  welcomeChannelId: { type: String, default: null },
  welcomeMessage: { type: String, default: null },
  welcomeEnabled: { type: Boolean, default: false },
  goodbyeChannelId: { type: String, default: null },
  goodbyeMessage: { type: String, default: null },
  goodbyeEnabled: { type: Boolean, default: false },
  
  // Autorole settings
  autoroleEnabled: { type: Boolean, default: false },
  autoroles: { type: [String], default: [] },
  
  // Verification settings
  verificationEnabled: { type: Boolean, default: false },
  verificationChannelId: { type: String, default: null },
  verifiedRoleId: { type: String, default: null },
  verificationMessage: { type: String, default: null },
  
  // Logging settings
  logChannelId: { type: String, default: null },
  logEvents: { type: [String], default: [] },
  
  // Moderation settings
  modLogChannelId: { type: String, default: null },
  muteRoleId: { type: String, default: null },
  automodEnabled: { type: Boolean, default: false },
  automodRules: { type: mongoose.Schema.Types.Mixed, default: {} },
  
  // Leveling/Gamification settings
  levelingEnabled: { type: Boolean, default: false },
  levelUpChannelId: { type: String, default: null },
  levelUpMessage: { type: String, default: null },
  xpMultiplier: { type: Number, default: 1 },
  levelRoles: { type: mongoose.Schema.Types.Mixed, default: {} },
  
  // Music settings
  musicChannelId: { type: String, default: null },
  djRoleId: { type: String, default: null },
  maxQueueSize: { type: Number, default: 100 },
  defaultVolume: { type: Number, default: 50 },
  
  // Giveaway settings
  giveawayRoleId: { type: String, default: null },
  giveawayPingEnabled: { type: Boolean, default: false },
  
  // Announcement settings
  announcementChannelId: { type: String, default: null },
  
  // Suggestion settings
  suggestionChannelId: { type: String, default: null },
  
  // Ticket settings
  ticketCategoryId: { type: String, default: null },
  ticketLogChannelId: { type: String, default: null },
  
  // Language settings
  language: { type: String, default: 'en' },
  
  // Prefix
  prefix: { type: String, default: '!' }
}, {
  timestamps: true // Automatically manages createdAt and updatedAt
});

// Static method to get or create guild config
guildConfigSchema.statics.getGuildConfig = async function(guildId) {
  if (!guildId) {
    throw new Error('Guild ID is required');
  }
  
  let config = await this.findOne({ guildId });
  
  if (!config) {
    // Create default configuration
    config = await this.create({ guildId });
  }
  
  return config;
};

// Static method to update guild config
guildConfigSchema.statics.updateGuildConfig = async function(guildId, updates) {
  if (!guildId) {
    throw new Error('Guild ID is required');
  }
  
  // Ensure config exists
  await this.getGuildConfig(guildId);
  
  // Update with new values
  const config = await this.findOneAndUpdate(
    { guildId },
    { $set: updates },
    { new: true, runValidators: true }
  );
  
  return config;
};

// Instance method to update a single field
guildConfigSchema.methods.setConfig = async function(key, value) {
  this[key] = value;
  await this.save();
  return this;
};

const GuildConfig = mongoose.model('GuildConfig', guildConfigSchema);

module.exports = GuildConfig;
