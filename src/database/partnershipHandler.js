// Partnership Handler
// Manages all partnership operations, requests, analytics, and cross-server integration

const Partnership = require('./partnershipSchema');
const User = require('./userSchema');

class PartnershipHandler {
  constructor() {
    this.activePartnerships = new Map();
    this.banListCache = new Map();
  }

  // Create partnership request
  async createPartnershipRequest(primaryGuildId, secondaryGuildId, requestData) {
    try {
      const partnershipId = `${primaryGuildId}-${secondaryGuildId}-${Date.now()}`;
      
      const partnership = new Partnership({
        partnershipId,
        primaryGuild: {
          guildId: primaryGuildId,
          ...requestData.primaryGuild
        },
        secondaryGuild: {
          guildId: secondaryGuildId,
          ...requestData.secondaryGuild
        },
        status: 'pending',
        requestedBy: requestData.requestedBy,
        agreement: {
          accepted: false
        }
      });
      
      await partnership.save();
      console.log(`[Partnership] Request created: ${partnershipId}`);
      return partnership;
    } catch (error) {
      console.error('[Partnership] Error creating request:', error);
      return null;
    }
  }

  // Approve partnership
  async approvePartnership(partnershipId, approverUserId, tier = 'bronze') {
    try {
      const partnership = await Partnership.findOneAndUpdate(
        { partnershipId },
        {
          status: 'active',
          tier,
          approvedBy: approverUserId,
          'agreement.accepted': true,
          'agreement.acceptedAt': new Date(),
          'agreement.acceptedBy': approverUserId
        },
        { new: true }
      );
      
      if (partnership) {
        this.activePartnerships.set(partnershipId, partnership);
        await this.grantPartnershipPerks(partnership);
      }
      
      return partnership;
    } catch (error) {
      console.error('[Partnership] Error approving:', error);
      return null;
    }
  }

  // Grant partnership perks
  async grantPartnershipPerks(partnership) {
    const perks = {
      bronze: { xpBonus: 5, coinsBonus: 3 },
      silver: { xpBonus: 10, coinsBonus: 7 },
      gold: { xpBonus: 15, coinsBonus: 12 },
      platinum: { xpBonus: 25, coinsBonus: 20 }
    };
    
    const tierPerks = perks[partnership.tier] || perks.bronze;
    partnership.perks = tierPerks;
    await partnership.save();
  }

  // Add shared ban
  async addSharedBan(partnershipId, userId, username, reason, evidence) {
    try {
      const partnership = await Partnership.findOneAndUpdate(
        { partnershipId },
        {
          $push: {
            'banListSharing.sharedBans': {
              userId,
              username,
              reason,
              bannedAt: new Date(),
              evidence
            }
          },
          $inc: { 'banListSharing.totalSharedBans': 1 }
        },
        { new: true }
      );
      
      return partnership;
    } catch (error) {
      console.error('[Partnership] Error adding ban:', error);
      return null;
    }
  }

  // Check if user is banned in partner guild
  async isUserBanned(partnershipId, userId) {
    try {
      const partnership = await Partnership.findOne(
        { partnershipId },
        { 'banListSharing.sharedBans': 1 }
      );
      
      if (!partnership || !partnership.banListSharing.sharedBans) return false;
      
      return partnership.banListSharing.sharedBans.some(ban => ban.userId === userId);
    } catch (error) {
      console.error('[Partnership] Error checking ban:', error);
      return false;
    }
  }

  // Get active partnerships for guild
  async getGuildPartnerships(guildId) {
    try {
      const partnerships = await Partnership.find({
        $or: [
          { 'primaryGuild.guildId': guildId },
          { 'secondaryGuild.guildId': guildId }
        ],
        status: 'active'
      });
      
      return partnerships;
    } catch (error) {
      console.error('[Partnership] Error fetching partnerships:', error);
      return [];
    }
  }

  // Add referral
  async addReferral(partnershipId, userId, sourceGuild) {
    try {
      await Partnership.findOneAndUpdate(
        { partnershipId },
        {
          $inc: { 'analytics.totalReferrals': 1, 'analytics.activeReferrals': 1 },
          $set: { 'analytics.lastInteraction': new Date() }
        }
      );
      
      // Add referral bonus to user
      await User.findOneAndUpdate(
        { userId },
        { $inc: { coins: 50 } }
      );
    } catch (error) {
      console.error('[Partnership] Error adding referral:', error);
    }
  }

  // Report violation
  async reportViolation(partnershipId, violationType, severity, description) {
    try {
      const partnership = await Partnership.findOneAndUpdate(
        { partnershipId },
        {
          $push: {
            violations: {
              type: violationType,
              severity,
              description,
              timestamp: new Date()
            }
          },
          $inc: { totalViolations: 1 }
        },
        { new: true }
      );
      
      // Update trust score
      let trustPenalty = 0;
      if (severity === 'low') trustPenalty = 5;
      if (severity === 'medium') trustPenalty = 15;
      if (severity === 'high') trustPenalty = 30;
      
      partnership.trustScore = Math.max(0, partnership.trustScore - trustPenalty);
      
      // Auto-suspend if trust too low
      if (partnership.trustScore < 20) {
        partnership.status = 'suspended';
      }
      
      await partnership.save();
      return partnership;
    } catch (error) {
      console.error('[Partnership] Error reporting violation:', error);
      return null;
    }
  }

  // Get partnership analytics
  async getPartnershipAnalytics(partnershipId) {
    try {
      const partnership = await Partnership.findOne({ partnershipId });
      return partnership?.analytics || null;
    } catch (error) {
      console.error('[Partnership] Error fetching analytics:', error);
      return null;
    }
  }

  // End partnership
  async endPartnership(partnershipId, reason) {
    try {
      await Partnership.findOneAndUpdate(
        { partnershipId },
        {
          status: 'expired',
          rejectionReason: reason,
          updatedAt: new Date()
        }
      );
      
      this.activePartnerships.delete(partnershipId);
      console.log(`[Partnership] Partnership ended: ${partnershipId}`);
      return true;
    } catch (error) {
      console.error('[Partnership] Error ending partnership:', error);
      return false;
    }
  }

  // Get all active partnerships
  async getAllActivePartnerships() {
    try {
      return await Partnership.find({ status: 'active' });
    } catch (error) {
      console.error('[Partnership] Error fetching all partnerships:', error);
      return [];
    }
  }
}

module.exports = new PartnershipHandler();
