const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
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
    channelId: {
        type: String,
        required: true,
        index: true
    },
    content: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
messageSchema.index({ userId: 1, guildId: 1 });
messageSchema.index({ guildId: 1, channelId: 1 });

module.exports = mongoose.model('Message', messageSchema);
