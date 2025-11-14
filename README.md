# MinfoAi v3.0 - Advanced Discord Bot

![Version](https://img.shields.io/badge/version-3.0.0-blue)
![Node.js](https://img.shields.io/badge/node.js-18+-green)
![License](https://img.shields.io/badge/license-MIT-brightgreen)

## 🤖 Overview

MinfoAi v3.0 is a complete rebuild of the Discord bot featuring:
- **AI Integration**: 100% open-source AI (Ollama/LLaMA) for intelligent conversations
- **User Consent System**: GDPR-compliant with granular permissions
- **AI-Powered Moderation**: Smart moderation based on behavior patterns
- **Advanced Database**: MongoDB with comprehensive user profiles
- **Server Requirement**: Users must join the official server to use the bot
- **Improved Partnerships**: Enhanced features beyond Skyforce
- **Custom Error Handling**: Centralized error management and logging

## ✨ Key Features

### 1. User Consent System (CRITICAL)
- Automatic consent request on first interaction
- GDPR-compliant permission model
- Tracks: username, avatar, guild membership, roles, interactions
- Visual consent embed with Accept/Decline buttons
- Stored in MongoDB with full audit trail

### 2. AI System (100% Open-Source)
- Ollama/LLaMA integration for local AI processing
- Learns user behavior patterns for personalized responses
- Privacy-first: data stored locally, not on external servers
- Adaptive learning from interactions

### 3. AI-Powered Moderation
- Analyzes messages and user behavior
- Flags spam, toxic language, suspicious patterns
- Automatic action execution
- Full moderation logs

### 4. Server Requirement Enforcement
- Users MUST be in: https://discord.gg/Pm24vTu3wR
- Validated on every interaction
- Returns helpful error message with invite

### 5. Advanced Database
- User profiles with behavior patterns
- Guild configurations
- Moderation history
- Consent tracking

### 6. Improved Partnership System
- Dynamic tier system (Bronze, Silver, Gold, Platinum)
- Revenue sharing model
- Cross-server events
- Partner reputation tracking
- Dedicated dashboard

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18.0.0
- MongoDB (local or Atlas)
- Ollama with LLaMA model
- Discord Bot Token

### Installation

```bash
# Clone repository
git clone https://github.com/Fl4chi/MinfoAi.git
cd MinfoAi

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your tokens and URIs

# Start AI server (Ollama)
ollama serve

# In another terminal, start bot
npm start
```

### Configuration

Edit `.env`:
```env
DISCORD_TOKEN=your_token
MONGODB_URI=mongodb://...
OLLAMA_API_URL=http://localhost:11434
OFFICIAL_SERVER_ID=your_server_id
```

## 📁 Project Structure

```
src/
├── bot.js                        # Main entry point
├── commands/                     # Slash commands
├── events/                       # Discord events
├── utils/
│   ├── errorHandler.js          # Error handling
│   ├── consentManager.js        # User consent
│   └── serverValidator.js       # Server validation
├── ai/
│   └── aiIntegration.js         # AI system
├── moderation/
│   └── aiModeration.js          # AI moderation
├── database/
│   ├── connection.js            # DB connection
│   └── userSchema.js            # User model
├── partnership/
│   └── partnershipManager.js    # Partner system
└── config/
    └── botConfig.js             # Configuration
```

## 🛠️ Development

```bash
# Run tests
npm run test

# Build project
npm run build

# Deploy bot
npm run deploy

# View logs
tail -f logs/error-*.log
```

## 📚 Documentation

For comprehensive documentation, see [v3-SETUP.md](./v3-SETUP.md)

## 🔧 Commands

### User Commands
- `/ai [message]` - Chat with AI
- `/info` - Bot information
- `/consent` - Manage permissions
- `/help` - Get help

### Admin Commands
- `/moderation` - Moderation settings
- `/logs` - View logs
- `/config` - Bot configuration

### Partner Commands
- `/partner apply` - Apply for partnership
- `/partner status` - Check status
- `/partner dashboard` - Partner dashboard

## 🐛 Troubleshooting

**Bot not responding?**
- Check Discord token in `.env`
- Verify bot intents are enabled
- Check MongoDB connection
- View logs in `logs/error-*.log`

**AI not working?**
- Verify Ollama is running: `ollama serve`
- Check `OLLAMA_API_URL` in `.env`
- Ensure LLaMA model is downloaded: `ollama pull llama2`

**Database errors?**
- Verify MongoDB URI format
- Check network access in MongoDB Atlas
- Verify database user permissions

## 📋 Version History

### v3.0 (Current)
- Complete rewrite from v2.0
- User consent system (GDPR-compliant)
- 100% open-source AI
- AI-powered moderation
- Advanced database restructuring
- Server requirement enforcement
- Improved partnership system
- Custom error handling

### v2.0
- Previous version (deprecated)

## 📄 License

MIT License - See [LICENSE](./LICENSE) file

## 🤝 Support

For help and questions: [Join our Discord](https://discord.gg/Pm24vTu3wR)

## 👥 Contributors

- **Fl4chi** - Lead Developer
- **MinfoAi Community** - Contributors

---

**Version**: 3.0.0  
**Status**: Active Development  
**Last Updated**: 2024  

⭐ If you find MinfoAi useful, please consider giving it a star!
