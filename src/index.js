// src/index.js
// Load environment variables and bootstrap the application
require('dotenv').config();

// Validate required environment variables early
const required = ['DISCORD_TOKEN', 'MONGODB_URI'];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  console.error(`[MinfoAi] Missing required env vars: ${missing.join(', ')}`);
  process.exit(1);
}

// Connect to database and start the bot
const mongoose = require('mongoose');
(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      autoIndex: true,
    });
    console.log('[MinfoAi] MongoDB connected');

    // Start Discord bot
    require('./bot');
  } catch (err) {
    console.error('[MinfoAi] Startup failure:', err);
    process.exit(1);
  }
})();
