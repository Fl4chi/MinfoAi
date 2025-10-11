const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true,
        index: true
    },
    guildId: {
        type: String,
        required: true,
        index: true
    },
    xp: {
        type: Number,
        default: 0
    },
    level: {
        type: Number,
        default: 1
    },
    messageCount: {
        type: Number,
        default: 0
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    preferences: {
        language: {
            type: String,
            default: 'en'
        },
        notifications: {
            type: Boolean,
            default: true
        },
        theme: {
            type: String,
            default: 'default'
        }
    },
    interests: {
        type: [String],
        default: []
    },
    warnings: {
        type: Number,
        default: 0
    },
    achievements: {
        type: [{
            name: String,
            description: String,
            unlockedAt: {
                type: Date,
                default: Date.now
            }
        }],
        default: []
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
userSchema.index({ userId: 1, guildId: 1 }, { unique: true });

module.exports = mongoose.model('User', userSchema);
