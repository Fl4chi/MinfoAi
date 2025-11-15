# Slash Commands Deployment Guide

## Problem: Slash Commands Not Appearing in Discord

If you're experiencing an issue where slash commands (`/`) are not showing up in Discord when you type them, follow this comprehensive troubleshooting and deployment guide.

---

## Quick Diagnosis Checklist

- [ ] `.env` file exists in the project root
- [ ] `DISCORD_TOKEN` is set in `.env`
- [ ] `CLIENT_ID` is set in `.env`
- [ ] Bot has `applications.commands` scope
- [ ] `src/commands/` directory exists with command files
- [ ] `scripts/deploy-commands.js` exists
- [ ] Deployment script has been run: `node scripts/deploy-commands.js`
- [ ] Bot is invited to Discord server with proper permissions

---

## Step 1: Verify Your `.env` File

### Create or Update `.env`

Your `.env` file should be in the **root directory** of the project:

```env
# Discord Bot
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_application_id_here
GUILD_ID=your_test_server_id_here  # Optional: for guild-specific deployment (instant)

# Other configurations
MONGODB_URI=mongodb://...
OLLAMA_API_URL=http://localhost:11434
OFFICIAL_SERVER_ID=...
```

### How to Get Your IDs

**DISCORD_TOKEN:**
1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click on your application
3. Go to "Bot" section
4. Copy the token from "TOKEN" section
5. Paste it in `.env` as `DISCORD_TOKEN=YOUR_TOKEN`

**CLIENT_ID:**
1. In Developer Portal, go to "General Information"
2. Copy the "Application ID"
3. Paste it in `.env` as `CLIENT_ID=YOUR_ID`

**GUILD_ID (Optional but Recommended for Testing):**
1. In Discord, enable Developer Mode (User Settings > Advanced > Developer Mode)
2. Right-click your test server and click "Copy Server ID"
3. Paste it in `.env` as `GUILD_ID=YOUR_GUILD_ID`
4. This enables **instant command deployment** for testing

---

## Step 2: Verify Bot Has Proper Scopes and Permissions

### Check Bot Scopes

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Go to "OAuth2" > "URL Generator"
4. Under "SCOPES", ensure these are checked:
   - `bot`
   - `applications.commands`
5. Under "PERMISSIONS", select:
   - `Send Messages`
   - `Embed Links`
   - `Read Message History`
   - `Manage Messages`
   - `Manage Roles` (if using moderation)
   - And any other permissions needed
6. Copy the generated URL
7. Open it in browser to re-invite bot with proper scopes

---

## Step 3: Deploy Commands

### Run the Deployment Script

In your project directory, run:

```bash
node scripts/deploy-commands.js
```

### Expected Output (Success)

You should see something like:

```
🔧 [DEPLOY] Starting command deployment...
📁 [INFO] Found 8 command file(s)
✅ [LOAD] Successfully loaded: info
✅ [LOAD] Successfully loaded: setbot
✅ [LOAD] Successfully loaded: permission
✅ [LOAD] Successfully loaded: moderate
✅ [LOAD] Successfully loaded: botstatus
✅ [LOAD] Successfully loaded: permission
🚀 [INFO] Loaded 8 valid command(s): info, setbot, permission, moderate, botstatus...
🔄 [DEPLOY] Refreshing 8 slash command(s)...
🎯 [INFO] Deploying to guild YOUR_GUILD_ID for instant updates
✅ [SUCCESS] Successfully deployed 8 slash command(s) - guild (instant updates)
📋 [INFO] Deployed commands:
 • /info - Mostra informazioni complete e paginate su un utente
 • /setbot - Modifica le impostazioni del bot
 • /permission - Gestisci i permessi
 • /moderate - Moderazione avanzata
 • /botstatus - Mostra lo stato del bot
🎉 [DONE] Command deployment completed successfully!
```

### Possible Error Messages and Solutions

**Error: "DISCORD_TOKEN not found in environment variables"**
- Solution: Add `DISCORD_TOKEN=your_token` to `.env` file

**Error: "CLIENT_ID not found in environment variables"**
- Solution: Add `CLIENT_ID=your_app_id` to `.env` file

**Error: "Commands directory not found"**
- Solution: Ensure `src/commands/` directory exists with command files

**Error: "No command files found in src/commands directory"**
- Solution: Verify command `.js` files exist in `src/commands/` and have proper structure

**Error: "Missing Access: Bot lacks permissions in the specified guild"**
- Solution:
  1. Re-invite bot with `applications.commands` scope
  2. Ensure bot has "Administrator" or required permissions in test guild
  3. Use generated OAuth2 URL from Developer Portal

**Error: "Invalid Token: The DISCORD_TOKEN is invalid or expired"**
- Solution:
  1. Regenerate bot token in Developer Portal
  2. Update `.env` with new token

**Error: "Invalid Guild: The GUILD_ID in your .env is invalid"**
- Solution:
  1. Double-check GUILD_ID is correct
  2. Get it by right-clicking server > Copy Server ID
  3. Ensure bot is invited to that server

---

## Step 4: Start Your Bot

After successful deployment, start your bot:

```bash
npm start
```

---

## Step 5: Test Commands in Discord

1. Go to your Discord test server
2. Type `/` in the message box
3. You should see a list of available commands
4. Select one and test it

### If Commands Still Don't Appear

**If using GUILD_ID (Guild-Specific Deployment):**
- Commands appear **instantly** in that specific server
- Make sure you're testing in the correct server
- Try refreshing Discord (F5)

**If using Global Deployment (no GUILD_ID):**
- Commands take **up to 1 hour** to propagate globally
- They will appear in all servers your bot is in
- If after 1 hour they still don't appear, re-run deployment script

---

## Deployment Strategies

### Strategy 1: Guild-Specific (RECOMMENDED FOR TESTING)

**Fastest for development!**

`.env`:
```env
DISCORD_TOKEN=...
CLIENT_ID=...
GUILD_ID=YOUR_TEST_SERVER_ID  # Add this
```

**Pros:**
- Commands appear instantly
- Perfect for testing and development
- No waiting time

**Cons:**
- Commands only in one server
- Not suitable for production

### Strategy 2: Global Deployment (FOR PRODUCTION)

**For production bots**

`.env`:
```env
DISCORD_TOKEN=...
CLIENT_ID=...
# No GUILD_ID - commands deploy globally
```

**Pros:**
- Commands available in all servers
- Proper production setup

**Cons:**
- Takes up to 1 hour to propagate
- Requires patience for testing

---

## Command File Structure

Each command in `src/commands/` must have this structure:

```javascript
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('commandname')
    .setDescription('Command description')
    .addUserOption(opt => 
      opt.setName('user')
         .setDescription('Select a user')
         .setRequired(false)
    ),
  
  async execute(interaction) {
    // Command logic here
    await interaction.reply('Response here');
  }
};
```

**Critical Requirements:**
- Must export an object with `data` and `execute`
- `data` must be instance of `SlashCommandBuilder`
- `execute` must be an async function
- Must have `.setName()` and `.setDescription()`

---

## Deployment Script Explanation

The `scripts/deploy-commands.js` file:

1. **Loads environment variables** from `.env`
2. **Validates** DISCORD_TOKEN and CLIENT_ID exist
3. **Reads all `.js` files** from `src/commands/`
4. **Validates each command** has proper structure
5. **Sends commands to Discord API**
6. **Reports success or errors** with debugging info

### How It Works

```javascript
// 1. Environment check
if (!process.env.DISCORD_TOKEN) { /* error */ }

// 2. Read command files
const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));

// 3. Load each command
for (const file of commandFiles) {
  const command = require(filePath);
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  }
}

// 4. Deploy to Discord
const rest = new REST().setToken(process.env.DISCORD_TOKEN);
await rest.put(deploymentRoute, { body: commands });
```

---

## Common Issues and Solutions

### Issue: "Commands loaded but Discord shows 0 commands"

**Solution:**
1. Check `.env` file was created and saved
2. Verify DISCORD_TOKEN is correct (re-generate if needed)
3. Run deployment script again
4. Restart Discord client (or refresh with F5)
5. If still not appearing:
   ```bash
   # Clear require cache and try again
   node scripts/deploy-commands.js
   ```

### Issue: "Bot works but commands take 1 hour to appear"

**Solution:**
- Add GUILD_ID to `.env` for instant testing:
  ```env
  GUILD_ID=YOUR_TEST_SERVER_ID
  ```
- Re-run deployment: `node scripts/deploy-commands.js`
- Commands will appear instantly in that guild

### Issue: "Permission denied" or "Forbidden" errors

**Solution:**
1. Go to Discord Developer Portal
2. Re-generate OAuth2 URL with:
   - Scopes: `bot` + `applications.commands`
   - Permissions: All needed permissions
3. Click the URL to re-invite bot
4. Run deployment script again

### Issue: "Cannot find module 'discord.js'"

**Solution:**
```bash
# Install dependencies
npm install
```

---

## Verification Checklist

Before running deployment, verify:

```
✅ .env file created in project root
✅ DISCORD_TOKEN set in .env
✅ CLIENT_ID set in .env
✅ Bot invited to Discord server
✅ Bot has applications.commands scope
✅ src/commands/ directory exists
✅ Command .js files exist in src/commands/
✅ Each command has data and execute properties
✅ scripts/deploy-commands.js exists
✅ npm install completed
```

---

## Final Testing Steps

1. **Run deployment script:**
   ```bash
   node scripts/deploy-commands.js
   ```
   Verify "✅ [SUCCESS]" message appears

2. **Start bot:**
   ```bash
   npm start
   ```
   Wait for bot to fully load

3. **Test in Discord:**
   - Type `/` in server channel
   - Select a command
   - Verify it executes

4. **If not working:**
   - Check console output for errors
   - Review this guide's troubleshooting section
   - Verify all `.env` values are correct

---

## Additional Resources

- [Discord.js Slash Commands Docs](https://discordjs.guide/slash-commands/)
- [Discord Developer Portal](https://discord.com/developers/applications)
- [MinfoAi Main Readme](./README.md)
- [Setup Guide](./v3-SETUP.md)

---

## Support

If you're still having issues:

1. Check the troubleshooting section above
2. Review console output for error messages
3. Verify `.env` file configuration
4. Ensure deployment script runs successfully
5. Join our Discord: https://discord.gg/Pm24vTu3wR

**Version**: 1.0
**Last Updated**: 2024
