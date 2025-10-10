require('dotenv').config();

const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, '../src/commands');

// Read all files in commands directory
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
    console.log(`[DEPLOY] Loaded command: ${command.data.name}`);
  } else {
    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

// Construct and prepare an instance of the REST module
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// Deploy commands
(async () => {
  try {
    console.log(`[DEPLOY] Started refreshing ${commands.length} application (/) commands.`);
    
    // Deploy to specific guild for instant updates during development
    const data = await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands },
    );
    
    console.log(`[DEPLOY] Successfully reloaded ${data.length} application (/) commands.`);
    console.log('[DEPLOY] Commands deployed to guild:', process.env.GUILD_ID);
  } catch (error) {
    console.error('[ERROR] Failed to deploy commands:', error);
  }
})();
