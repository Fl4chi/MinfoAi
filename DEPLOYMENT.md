# 📦 Deployment Guide

This document explains how to deploy Discord slash commands for the MinfoAi bot.

## 🔧 Recent Fixes (Oct 12, 2025)

The following issues have been fixed:

### ✅ Fixed Files

1. **src/commands/setbot.js**
   - Fixed `.addOptions()` syntax by adding array brackets `[...]` to all option calls
   - Corrected closing parentheses and structure
   - Fixed verify select menu structure

2. **src/commands/info.js**
   - Verified correct module exports and structure ✓

3. **src/commands/permission.js**
   - Verified correct module exports and structure ✓

## 🚀 Deploying Commands

### Prerequisites

You need the following environment variables:

- **DISCORD_TOKEN** - Your Discord bot token
- **CLIENT_ID** - Your Discord application's client ID
- **GUILD_ID** (Optional) - Specific guild ID for instant testing deployment

### Method 1: Local Deployment (Recommended for Testing)

1. Create a `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```

2. Fill in your credentials in `.env`:
   ```env
   DISCORD_TOKEN=your_bot_token_here
   CLIENT_ID=your_client_id_here
   GUILD_ID=your_guild_id_here  # Optional: for instant guild-specific deployment
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Run the deploy script:
   ```bash
   npm run deploy:cmd
   ```

   Or directly:
   ```bash
   node scripts/deploy-commands.js
   ```

### Method 2: GitHub Actions (Automatic)

A GitHub Actions workflow (`.github/workflows/deploy-commands.yml`) has been configured to automatically deploy commands.

#### 🔑 Required GitHub Secrets

To use GitHub Actions deployment, you **MUST** configure the following repository secrets:

1. Go to your repository Settings → Secrets and variables → Actions
2. Add the following secrets:

   - **TOKEN** - Your Discord bot token (will be mapped to DISCORD_TOKEN)
   - **CLIENT_ID** - Your Discord application's client ID

#### How to Add Secrets:

1. Navigate to: `https://github.com/Fl4chi/MinfoAi/settings/secrets/actions`
2. Click "New repository secret"
3. Add each secret:
   - Name: `TOKEN`, Secret: Your Discord bot token
   - Name: `CLIENT_ID`, Secret: Your Discord application client ID

#### Automatic Triggers

The workflow will automatically run when:
- You push changes to the `main` branch that affect:
  - Files in `src/commands/**`
  - The deploy script `scripts/deploy-commands.js`

#### Manual Trigger

1. Go to the Actions tab: https://github.com/Fl4chi/MinfoAi/actions
2. Select "Deploy Discord Commands" workflow
3. Click "Run workflow" → Select `main` branch → Click "Run workflow"

## 📝 Deployment Types

### Global Deployment (Default)

If you don't set `GUILD_ID`, commands are deployed globally:
- ✅ Available in all servers where the bot is added
- ⏱️ **Takes up to 1 hour** to propagate across Discord

### Guild-Specific Deployment

If you set `GUILD_ID`, commands are deployed to that specific guild:
- ✅ **Instant** updates (no waiting time)
- ⚠️ Only available in the specified guild
- 🔧 Recommended for testing and development

## ✅ Verification

After deployment, verify your commands:

1. In Discord, type `/` in any channel
2. You should see all bot commands appear in the slash command menu:
   - `/setbot` - Configure the bot
   - `/info` - View bot information
   - `/permission` - Manage permissions
   - And all other commands...

## 🐛 Troubleshooting

### Error: "DISCORD_TOKEN not found"

**Solution**: Make sure you've set up the environment variables correctly:
- **Local**: Create a `.env` file with `DISCORD_TOKEN=your_token`
- **GitHub Actions**: Add the `TOKEN` secret in repository settings

### Error: "CLIENT_ID not found"

**Solution**: Add your Discord application's client ID:
- **Local**: Add `CLIENT_ID=your_client_id` to `.env`
- **GitHub Actions**: Add the `CLIENT_ID` secret in repository settings

### Commands not appearing in Discord

**Solutions**:
1. **Global deployment**: Wait up to 1 hour for propagation
2. **Guild deployment**: Set `GUILD_ID` in your environment for instant updates
3. **Bot permissions**: Ensure your bot has `applications.commands` scope
4. **Re-invite**: If needed, re-invite the bot with the correct scopes

### GitHub Actions workflow failing

**Solutions**:
1. Check the Actions tab for detailed error logs
2. Verify that both `TOKEN` and `CLIENT_ID` secrets are configured
3. Ensure secrets are not expired or invalid

## 🔗 Useful Links

- [Discord Developer Portal](https://discord.com/developers/applications)
- [Discord.js Guide](https://discordjs.guide/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## 📞 Support

If you encounter any issues:
1. Check the error messages in the console or Actions logs
2. Verify all environment variables are correctly set
3. Ensure your bot token and client ID are valid
4. Check that the bot has proper permissions in your Discord server
