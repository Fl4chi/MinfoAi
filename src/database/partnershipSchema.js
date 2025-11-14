// Partnership Schema
// Manages server partnerships with advanced features like ban sharing and cross-server integration

const mongoose = require('mongoose');

const partnershipSchema = new mongoose.Schema({
  partnershipId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Primary Partner Info
  primaryGuild: {
    guildId: String,
    guildName: String,
    guildIcon: String,
    ownerUserId: String,
    ownerUsername: String,
    memberCount: Number,
    description: String,
    inviteLink: String
  },
  
  // Secondary Partner Info
  secondaryGuild: {
    guildId: String,
    guildName: String,
    guildIcon: String,
    ownerUserId: String,
    ownerUsername: String,
    memberCount: Number,
    description: String,
    inviteLink: String
  },
  
  // Partnership Status
  status: {
    type: String,
    enum: ['pending', 'active', 'suspended', 'rejected', 'expired'],
    default: 'pending',
    index: true
  },
  
  // Tier System
  tier: {
    type: String,
    enum: ['bronze', 'silver', 'gold', 'platinum'],
    default: 'bronze'
  },
  
  // Partnership Features
  features: {
    enabled: Boolean,
    type: [String], // e.g., ['cross_promotion', 'ban_sharing', 'shared_events', 'exclusive_perks']
    default: ['cross_promotion']
  },
  
  // Ban List Sharing
  banListSharing: {
    enabled: {
      type: Boolean,
      default: false
    },
    sharedBans: [
      {
        userId: String,
        username: String,
        reason: String,
        bannerGuild: String,
        bannedAt: { type: Date, default: Date.now },
        evidence: String
      }
    ],
    totalSharedBans: {
      type: Number,
      default: 0
    }
  },
  
  // Partnership Perks
  perks: {
    xpBonus: {
      type: Number,
      default: 0 // Percentage bonus
    },
    coinsBonus: {
      type: Number,
      default: 0 // Percentage bonus
    },
    exclusiveRole: String, // Role given to partners
    specialBadge: String,
    customPrefix: String
  },
  
  // Analytics
  analytics: {
    totalReferrals: {
      type: Number,
      default: 0
    },
    activeReferrals: {
      type: Number,
      default: 0
    },
    communityInteractions: {
      type: Number,
      default: 0
    },
    crossServerEvents: {
      type: Number,
      default: 0
    },
    lastInteraction: Date
  },
  
  // Partnership Duration
  startedAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  expiresAt: Date,
  renewedAt: Date,
  
  // Moderation & Trust
  trustScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  violations: [
    {
      type: String, // Type of violation
      severity: String, // 'low', 'medium', 'high'
      description: String,
      timestamp: { type: Date, default: Date.now },
      resolvedAt: Date
    }
  ],
  totalViolations: {
    type: Number,
    default: 0
  },
  
  // Partnership Agreement
  agreement: {
    accepted: Boolean,
    acceptedAt: Date,
    acceptedBy: String,
    termsVersion: String,
    customTerms: String
  },
  
  // Partner Network
  networkConnections: [
    {
      partnerId: String,
      status: String,
      connectedAt: Date
    }
  ],
  
  // Custom Branding
  branding: {
    partnershipBanner: String,
    customColors: {
      primary: String,
      secondary: String
    },
    customMessage: String
  },
  
  // Notes & Admin
  adminNotes: String,
  requestedBy: String,
  approvedBy: String,
  rejectionReason: String,
  
  // Metadata
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true, collection: 'partnerships' });

// Indexes for performance
partnershipSchema.index({ partnershipId: 1 });
partnershipSchema.index({ 'primaryGuild.guildId': 1 });
partnershipSchema.index({ 'secondaryGuild.guildId': 1 });
partnershipSchema.index({ status: 1 });
partnershipSchema.index({ tier: 1 });
partnershipSchema.index({ startedAt: 1 });

const Partnership = mongoose.model('Partnership', partnershipSchema);

module.exports = Partnership;
