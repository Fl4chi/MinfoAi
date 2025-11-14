// User Database Schema
// Stores comprehensive user data including stats, interactions, preferences

const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // User Profile
  username: String,
  avatar: String,
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  
  // Gamification Stats
  xp: {
    type: Number,
    default: 0
  },
  level: {
    type: Number,
    default: 1
  },
  coins: {
    type: Number,
    default: 0
  },
  totalXpEarned: {
    type: Number,
    default: 0
  },
  
  // Moderation Data
  warnings: [
    {
      reason: String,
      moderator: String,
      timestamp: { type: Date, default: Date.now },
      expiresAt: Date
    }
  ],
  mutes: [
    {
      reason: String,
      moderator: String,
      startTime: { type: Date, default: Date.now },
      duration: Number
    }
  ],
  bans: [
    {
      reason: String,
      moderator: String,
      timestamp: { type: Date, default: Date.now },
      permanent: Boolean
    }
  ],
  
  // AI Interaction History
  aiInteractions: {
    totalMessages: {
      type: Number,
      default: 0
    },
    lastAiChat: Date,
    conversationHistory: [
      {
        message: String,
        response: String,
        sentiment: String,
        timestamp: { type: Date, default: Date.now }
      }
    ],
    aiPersonalityTraits: {
      communicationStyle: String,
      interests: [String],
      frequentTopics: [String]
    }
  },
  
  // Activity Log
  activityLog: [
    {
      type: String,
      action: String,
      details: mongoose.Schema.Types.Mixed,
      timestamp: { type: Date, default: Date.now, index: true }
    }
  ],
  
  // Preferences & Settings
  preferences: {
    notifications: {
      type: Boolean,
      default: true
    },
    publicProfile: {
      type: Boolean,
      default: false
    },
    dmNotifications: {
      type: Boolean,
      default: true
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  
  // Server-specific Data
  guildData: [
    {
      guildId: String,
      joinedAt: Date,
      roles: [String],
      xpInGuild: Number,
      warningsInGuild: Number,
      customNickname: String
    }
  ],
  
  // Achievements & Badges
  achievements: [
    {
      id: String,
      unlockedAt: Date,
      rarity: String // common, rare, epic, legendary
    }
  ],
  
  // Financial Data
  transactions: [
    {
      type: String,
      amount: Number,
      description: String,
      timestamp: { type: Date, default: Date.now }
    }
  ],
  
  // Notes & Custom Data
  customData: mongoose.Schema.Types.Mixed,
  notes: String,
  
  // Metadata
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true, collection: 'users' });

// Indexes for performance
userSchema.index({ userId: 1 });
userSchema.index({ createdAt: 1 });
userSchema.index({ 'activityLog.timestamp': 1 });
userSchema.index({ level: 1, xp: 1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
