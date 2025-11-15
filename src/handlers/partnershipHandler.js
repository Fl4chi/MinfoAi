const Partnership = require('../database/partnershipSchema');

class PartnershipHandler {
  static async createPartnership(guildId, data) {
    try {
      const partnership = await Partnership.findOneAndUpdate(
        { guildId },
        { 
          ...data,
          guildId,
          updatedAt: Date.now()
        },
        { upsert: true, new: true }
      );
      return partnership;
    } catch (error) {
      throw new Error(`Failed to create partnership: ${error.message}`);
    }
  }

  static async getPartnership(guildId) {
    try {
      return await Partnership.findOne({ guildId });
    } catch (error) {
      throw new Error(`Failed to get partnership: ${error.message}`);
    }
  }

  static async updatePartnership(guildId, data) {
    try {
      return await Partnership.findOneAndUpdate(
        { guildId },
        { ...data, updatedAt: Date.now() },
        { new: true }
      );
    } catch (error) {
      throw new Error(`Failed to update partnership: ${error.message}`);
    }
  }

  static async deletePartnership(guildId) {
    try {
      return await Partnership.findOneAndDelete({ guildId });
    } catch (error) {
      throw new Error(`Failed to delete partnership: ${error.message}`);
    }
  }

  static async getAllPartnerships() {
    try {
      return await Partnership.find({ enabled: true });
    } catch (error) {
      throw new Error(`Failed to get partnerships: ${error.message}`);
    }
  }

  static async canSendPartnership(guildId) {
    const partnership = await this.getPartnership(guildId);
    if (!partnership || !partnership.enabled) return false;
    
    const cooldown = 2 * 60 * 60 * 1000; // 2 ore
    const lastSent = partnership.lastSent || 0;
    return Date.now() - lastSent >= cooldown;
  }
}

module.exports = PartnershipHandler;
