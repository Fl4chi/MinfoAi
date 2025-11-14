# MinfoAi - Advanced Discord Bot

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Node.js](https://img.shields.io/badge/node.js-18+-green)
![License](https://img.shields.io/badge/license-MIT-brightgreen)

## 📋 Overview

MinfoAi is a comprehensive and feature-rich Discord bot designed to provide advanced moderation, AI-powered conversations, user management, and server partnerships. The latest version (2.0) includes a complete database restructuring with MongoDB, an integrated AI system using LangChain, and a sophisticated partnership framework.

### Key Features

✅ **Advanced Moderation**: Complete moderation suite with logging, warnings, and automatic actions
✅ **AI-Powered Chat**: Intelligent conversations using LangChain with memory and sentiment analysis
✅ **User Database**: Comprehensive MongoDB schema storing user stats, interactions, and preferences
✅ **Gamification**: Experience points (XP), leveling system, achievements, and badges
✅ **Partnership System**: Multi-tier partnership framework with trust scores and ban list sharing
✅ **Event Management**: Welcome/goodbye messages, event tracking, and statistics
✅ **Music Commands**: Integrated music playback and queue management
✅ **Customization**: Per-server configuration and user preferences
✅ **Open-Source AI**: Uses open-source AI models (HuggingFace) with optional OpenAI fallback

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB 5.0+ (local or MongoDB Atlas)
- Discord Bot Token
- Discord Server (for testing)

### Installation

For detailed installation and setup instructions, see [INSTALLATION.md](./INSTALLATION.md)

#### Quick Setup:

```bash
# 1. Clone the repository
git clone https://github.com/Fl4chi/MinfoAi.git
cd MinfoAi

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env
# Edit .env with your credentials

# 4. Start the bot
npm start
```

---

## 📦 Project Structure

```
MinfoAi/
├── src/
│   ├── index.js                 # Main bot entry point
│   ├── commands/                # Command files
│   ├── events/                  # Event handlers
│   ├── database/
│   │   ├── userSchema.js        # MongoDB user schema with comprehensive fields
│   │   ├── aiHandler.js         # LangChain AI integration
│   │   ├── dbConnection.js      # MongoDB connection management
│   │   └── partnershipSchema.js # Partnership data structure
│   ├── handlers/
│   │   └── partnershipHandler.js # Partnership system logic
│   └── utils/                   # Utility functions
├── INSTALLATION.md              # Detailed setup guide
├── PARTNERSHIP_GUIDE.md         # Partnership system documentation
├── .env.updated                 # Updated environment variables
├── .env.example                 # Environment template
├── package.json                 # Dependencies
└── README.md                    # This file
```

---

## 🗄️ Database (MongoDB)

The bot now features a comprehensive MongoDB schema for storing user data:

### User Schema Fields

```javascript
{
  userId: String,
  username: String,
  discriminator: String,
  avatar: String,
  
  // Gamification
  xp: Number,
  level: Number,
  reputation: Number,
  badges: [String],
  achievements: [String],
  
  // Moderation
  warnings: Number,
  mutes: [{
    muteId: String,
    reason: String,
    duration: Number,
    timestamp: Date
  }],
  bans: [{
    banId: String,
    reason: String,
    timestamp: Date
  }],
  
  // AI Interactions
  aiInteractions: Number,
  sentimentScore: Number,
  conversationHistory: [String],
  preferences: {
    language: String,
    timezone: String,
    aiEnabled: Boolean
  },
  
  // Activity
  joinDate: Date,
  lastActiveDate: Date,
  messageCount: Number,
  voteCount: Number,
  
  // Transactions
  transactions: [{
    type: String,
    amount: Number,
    timestamp: Date,
    description: String
  }]
}
```

---

## 🤖 AI System (LangChain Integration)

The bot now features an advanced AI system using LangChain:

### Features

- **Open-Source Models**: Primary support for HuggingFace models
- **Memory Management**: Conversation history and context awareness
- **Sentiment Analysis**: Automatic tone detection and response adjustment
- **User Profiling**: AI learns user preferences and communication style
- **Fallback System**: Optional OpenAI integration for advanced reasoning
- **Error Handling**: Robust error management and graceful degradation

### Usage

```javascript
const aiHandler = require('./database/aiHandler');

// Initialize AI
await aiHandler.initializeAI();

// Generate response
const response = await aiHandler.generateResponse(userId, userMessage, {
  context: conversationContext,
  personality: botPersonality
});
```

---

## 🤝 Partnership System

The bot features a comprehensive partnership framework allowing servers to collaborate.

### Partnership Tiers

| Tier | Member Limit | Ban List Sharing | Cross-Server Events | Support |
|------|-------------|-----------------|-------------------|----------|
| **Bronze** | Up to 5 | ✓ | ✗ | Community |
| **Silver** | Up to 20 | ✓ | ✓ | Priority |
| **Gold** | Up to 50 | ✓ | ✓ | Dedicated |
| **Platinum** | Unlimited | ✓ | ✓ | 24/7 Support |

### Key Features

- **Ban List Sharing**: Automatically share and sync ban lists between partner servers
- **Referral System**: Earn rewards by referring other servers
- **Trust Score**: 0-100 score based on partnership history and rule compliance
- **Cross-Server Events**: Organize events across multiple partner servers
- **Violation Reporting**: Automatic detection and handling of partnership violations
- **Analytics**: Detailed partnership statistics and member insights

For detailed partnership documentation, see [PARTNERSHIP_GUIDE.md](./PARTNERSHIP_GUIDE.md)

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Discord
DISCORD_TOKEN=your_bot_token_here
DISCORD_CLIENT_ID=your_client_id

# MongoDB
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/minfoai
MONGO_DB_NAME=minfoai

# AI System
AI_MODEL_TYPE=huggingface # or openai
HUGGINGFACE_API_KEY=your_huggingface_key
OPENAI_API_KEY=your_openai_key (optional)

# Bot Configuration
BOT_PREFIX=!
BOT_LANGUAGE=en
BOT_TIMEZONE=UTC

# Features
AI_ENABLED=true
MODERATION_ENABLED=true
PARTNERSHIP_ENABLED=true
MUSIC_ENABLED=true
```

For a complete list of environment variables, see [.env.updated](./.env.updated)

---

## 📖 Commands

### Admin Commands

- `/ban <user> [reason]` - Ban a user from the server
- `/kick <user> [reason]` - Kick a user from the server
- `/warn <user> [reason]` - Warn a user
- `/mute <user> <duration> [reason]` - Mute a user
- `/unmute <user>` - Unmute a user

### AI Commands

- `/ask <question>` - Ask the AI a question
- `/chat` - Start a conversation with the AI
- `/ai-settings` - Configure AI behavior

### Partnership Commands

- `/partnership request` - Request to form a partnership
- `/partnership view` - View partnership details
- `/partnership manage` - Manage partnership settings
- `/partnership stats` - View partnership statistics

### User Commands

- `/profile` - View your user profile
- `/stats` - View your statistics
- `/achievements` - View your achievements
- `/leaderboard` - View server leaderboard

### Music Commands

- `/play <song>` - Play a song
- `/stop` - Stop playback
- `/queue` - View music queue
- `/skip` - Skip current song

---

## 🔧 Development

### Setting Up Development Environment

```bash
# Install dev dependencies
npm install --save-dev nodemon

# Start in development mode (with auto-reload)
npm run dev

# Run tests
npm test
```

### Creating New Commands

```javascript
module.exports = {
  name: 'ping',
  description: 'Ping command',
  async execute(message, args) {
    await message.reply('Pong!');
  }
};
```

### Creating New Events

```javascript
module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    // Handle message event
  }
};
```

---

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

---

## 📊 Performance & Optimization

### Database Optimization

- Connection pooling with automatic retry logic
- Indexed queries for fast data retrieval
- Batch operations for bulk updates
- Connection health checks

### AI System Optimization

- Model caching for faster inference
- Conversation memory management
- Token usage optimization
- Asynchronous processing with queue management

### Bot Optimization

- Event-driven architecture
- Efficient command parsing
- Rate limiting and cooldowns
- Memory leak prevention

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## 🆘 Support

### Documentation

- [Installation Guide](./INSTALLATION.md)
- [Partnership System Guide](./PARTNERSHIP_GUIDE.md)
- [Deployment Guide](./DEPLOYMENT.md)

### Getting Help

- Join our [Discord Support Server](https://discord.gg/your-invite-link)
- Open an [Issue on GitHub](https://github.com/Fl4chi/MinfoAi/issues)
- Check [FAQ](./FAQ.md) for common questions

---

## 🎯 Roadmap

- [ ] Voice-based AI integration
- [ ] Machine learning for user behavior prediction
- [ ] Advanced analytics dashboard
- [ ] Mobile app for partnership management
- [ ] Multi-language support
- [ ] Integration with more AI providers
- [ ] Custom command builder
- [ ] Web-based configuration panel

---

## 👨‍💻 Author

**Fl4chi** - [GitHub Profile](https://github.com/Fl4chi)

---

## 🙏 Acknowledgments

- Discord.js community for the amazing library
- LangChain team for the AI integration framework
- MongoDB documentation and community
- All contributors who have helped improve MinfoAi

---

**Last Updated**: 2024
**Status**: Active Development ✨
