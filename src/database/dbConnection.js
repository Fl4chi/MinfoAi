// Database Connection Manager
// Handles MongoDB connection with retry logic and health checks

const mongoose = require('mongoose');
const User = require('./userSchema');

class DatabaseManager {
  constructor() {
    this.isConnected = false;
    this.retryCount = 0;
    this.maxRetries = 5;
    this.retryDelay = 5000;
  }

  async connect() {
    try {
      const mongoURI = process.env.MONGODB_URI;
      
      if (!mongoURI) {
        throw new Error('MONGODB_URI environment variable is not set');
      }

      await mongoose.connect(mongoURI, {
        maxPoolSize: 10,
        minPoolSize: 5,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4
      });

      this.isConnected = true;
      this.retryCount = 0;
      console.log('[Database] Connected to MongoDB successfully');
      
      // Initialize indexes
      await this.initializeIndexes();
      
      // Start health check
      this.startHealthCheck();
      
      return true;
    } catch (error) {
      console.error('[Database] Connection failed:', error.message);
      
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`[Database] Retrying connection (${this.retryCount}/${this.maxRetries}) in ${this.retryDelay}ms...`);
        setTimeout(() => this.connect(), this.retryDelay);
      } else {
        console.error('[Database] Max retries reached. Database connection failed.');
        process.exit(1);
      }
      
      return false;
    }
  }

  async initializeIndexes() {
    try {
      // Create indexes for better performance
      await User.collection.createIndex({ userId: 1 });
      await User.collection.createIndex({ createdAt: 1 });
      await User.collection.createIndex({ 'activityLog.timestamp': 1 });
      await User.collection.createIndex({ level: 1, xp: 1 });
      
      console.log('[Database] Indexes initialized');
    } catch (error) {
      console.error('[Database] Error initializing indexes:', error);
    }
  }

  startHealthCheck() {
    // Run health check every 30 seconds
    setInterval(async () => {
      try {
        const admin = mongoose.connection.db.admin();
        const status = await admin.ping();
        
        if (status && this.isConnected === false) {
          console.log('[Database] Connection restored');
          this.isConnected = true;
        }
      } catch (error) {
        if (this.isConnected) {
          console.warn('[Database] Health check failed:', error.message);
          this.isConnected = false;
        }
      }
    }, 30000);
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('[Database] Disconnected from MongoDB');
      return true;
    } catch (error) {
      console.error('[Database] Error disconnecting:', error);
      return false;
    }
  }

  isHealthy() {
    return this.isConnected && mongoose.connection.readyState === 1;
  }

  async getUser(userId) {
    try {
      return await User.findOne({ userId });
    } catch (error) {
      console.error('[Database] Error fetching user:', error);
      return null;
    }
  }

  async createOrUpdateUser(userId, data) {
    try {
      return await User.findOneAndUpdate(
        { userId },
        { $set: data },
        { upsert: true, new: true, lean: false }
      );
    } catch (error) {
      console.error('[Database] Error creating/updating user:', error);
      return null;
    }
  }

  async incrementUserXP(userId, amount) {
    try {
      return await User.findOneAndUpdate(
        { userId },
        { 
          $inc: { xp: amount, totalXpEarned: amount },
          $set: { updatedAt: new Date() }
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('[Database] Error incrementing XP:', error);
      return null;
    }
  }

  async addWarning(userId, reason, moderatorId) {
    try {
      return await User.findOneAndUpdate(
        { userId },
        {
          $push: {
            warnings: {
              reason,
              moderator: moderatorId,
              timestamp: new Date()
            }
          },
          $set: { updatedAt: new Date() }
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('[Database] Error adding warning:', error);
      return null;
    }
  }

  async logActivity(userId, action, details) {
    try {
      return await User.findOneAndUpdate(
        { userId },
        {
          $push: {
            activityLog: {
              action,
              details,
              timestamp: new Date()
            }
          },
          $set: { updatedAt: new Date() }
        },
        { upsert: true, new: true }
      );
    } catch (error) {
      console.error('[Database] Error logging activity:', error);
      return null;
    }
  }

  async getLeaderboard(guildId, limit = 10) {
    try {
      return await User.find(
        { 'guildData.guildId': guildId }
      )
      .select('userId username xp level')
      .sort({ xp: -1 })
      .limit(limit)
      .lean();
    } catch (error) {
      console.error('[Database] Error fetching leaderboard:', error);
      return [];
    }
  }
}

module.exports = new DatabaseManager();
