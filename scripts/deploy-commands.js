require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commands = [];
const commandsPath = path.join(__dirname, '../src/commands');

// Check if environment variables are loaded
if (!process.env.DISCORD_TOKEN) {
  console.error('❌ [ERROR] DISCORD_TOKEN not found in environment variables.');
  console.log('💡 [INFO] Make sure you have a .env file with DISCORD_TOKEN=your_bot_token');
  process.exit(1);
}

if (!process.env.CLIENT_ID) {
  console.error('❌ [ERROR] CLIENT_ID not found in environment variables.');
  console.log('💡 [INFO] Make sure you have CLIENT_ID=your_application_id in your .env file');
  process.exit(1);
}

console.log('🔧 [DEPLOY] Starting command deployment...');

// Read all command files
if (!fs.existsSync(commandsPath)) {
  console.error(`❌ [ERROR] Commands directory not found: ${commandsPath}`);
  process.exit(1);
}

const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

if (commandFiles.length === 0) {
  console.warn('⚠️ [WARNING] No command files found in src/commands directory');
  process.exit(0);
}

console.log(`📁 [INFO] Found ${commandFiles.length} command file(s)`);

// Load all commands
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  try {
    // Clear require cache to ensure fresh load
    delete require.cache[require.resolve(filePath)];
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
      commands.push(command.data.toJSON());
      console.log(`✅ [LOAD] Successfully loaded: ${command.data.name}`);
    } else {
      console.warn(`⚠️ [WARNING] Command at ${file} is missing 'data' or 'execute' property`);
    }
  } catch (error) {
    console.error(`❌ [ERROR] Failed to load command ${file}:`, error.message);
  }
}

if (commands.length === 0) {
  console.error('❌ [ERROR] No valid commands loaded. Deployment cancelled.');
  process.exit(1);
}

console.log(`🚀 [INFO] Loaded ${commands.length} valid command(s): ${commands.map(cmd => cmd.name).join(', ')}`);

// Construct REST module
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

// Deploy commands function
async function deployCommands() {
  try {
    console.log(`🔄 [DEPLOY] Refreshing ${commands.length} slash command(s)...`);
    
    let deploymentRoute;
    let deploymentType;
    
    // Check if GUILD_ID is provided for guild-specific deployment
    if (process.env.GUILD_ID) {
      deploymentRoute = Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID);
      deploymentType = 'guild (instant updates)';
      console.log(`🎯 [INFO] Deploying to guild ${process.env.GUILD_ID} for instant updates`);
    } else {
      deploymentRoute = Routes.applicationCommands(process.env.CLIENT_ID);
      deploymentType = 'global (may take up to 1 hour)';
      console.log('🌍 [INFO] Deploying globally (takes up to 1 hour to propagate)');
    }
    
    const data = await rest.put(deploymentRoute, { 
      body: commands 
    });
    
    console.log(`✅ [SUCCESS] Successfully deployed ${data.length} slash command(s) - ${deploymentType}`);
    
    // List deployed commands
    console.log('📋 [INFO] Deployed commands:');
    data.forEach(cmd => {
      console.log(`   • /${cmd.name} - ${cmd.description}`);
    });
    
    // Additional info
    if (process.env.GUILD_ID) {
      console.log('\n💡 [TIP] Commands are deployed to your test guild and should be available immediately');
      console.log('💡 [TIP] To deploy globally, remove GUILD_ID from your .env and run this script again');
    } else {
      console.log('\n💡 [TIP] Global commands may take up to 1 hour to appear in all servers');
      console.log('💡 [TIP] For instant testing, add GUILD_ID=your_test_guild_id to your .env');
    }
    
    console.log('\n🎉 [DONE] Command deployment completed successfully!');
    
  } catch (error) {
    console.error('❌ [ERROR] Command deployment failed:');
    
    if (error.code === 50001) {
      console.error('   • Missing Access: Bot lacks permissions in the specified guild');
      console.error('   • Solution: Make sure the bot is invited to your server with applications.commands scope');
    } else if (error.code === 10004) {
      console.error('   • Invalid Guild: The GUILD_ID in your .env is invalid');
      console.error('   • Solution: Check that GUILD_ID matches your Discord server ID');
    } else if (error.status === 401) {
      console.error('   • Invalid Token: The DISCORD_TOKEN is invalid or expired');
      console.error('   • Solution: Check your bot token in .env file');
    } else if (error.status === 403) {
      console.error('   • Forbidden: Bot lacks necessary permissions');
      console.error('   • Solution: Ensure bot has applications.commands permission');
    } else {
      console.error('   • Unexpected error:', error.message);
      if (error.code) console.error('   • Error code:', error.code);
      if (error.status) console.error('   • HTTP status:', error.status);
    }
    
    console.log('\n🔧 [DEBUG] Environment check:');
    console.log(`   • DISCORD_TOKEN: ${process.env.DISCORD_TOKEN ? '✅ Set' : '❌ Missing'}`);
    console.log(`   • CLIENT_ID: ${process.env.CLIENT_ID ? '✅ Set' : '❌ Missing'}`);
    console.log(`   • GUILD_ID: ${process.env.GUILD_ID ? `✅ Set (${process.env.GUILD_ID})` : '⚠️ Not set (will deploy globally)'}`);
    
    process.exit(1);
  }
}

// Execute deployment
deployCommands();

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 [INFO] Deployment cancelled by user');
  process.exit(0);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ [ERROR] Unhandled promise rejection:', error);
  process.exit(1);
});
