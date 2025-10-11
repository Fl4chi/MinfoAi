const { Events } = require('discord.js');
const { logActivity } = require('../logs/activityLog');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        
        // Log comando non trovato
        logActivity('error', 'command_not_found', {
          commandName: interaction.commandName,
          userId: interaction.user.id,
          username: interaction.user.tag,
          guildId: interaction.guildId,
          guildName: interaction.guild?.name
        });
        
        return;
      }
      
      try {
        // Log esecuzione comando
        logActivity('command', interaction.commandName, {
          userId: interaction.user.id,
          username: interaction.user.tag,
          guildId: interaction.guildId,
          guildName: interaction.guild?.name,
          channelId: interaction.channelId,
          options: interaction.options.data.map(opt => ({
            name: opt.name,
            value: opt.value
          }))
        });
        
        await command.execute(interaction);
        
      } catch (error) {
        console.error(`Error executing ${interaction.commandName}:`, error);
        
        // Log errore esecuzione comando
        logActivity('error', 'command_execution_error', {
          commandName: interaction.commandName,
          userId: interaction.user.id,
          username: interaction.user.tag,
          guildId: interaction.guildId,
          guildName: interaction.guild?.name,
          errorMessage: error.message,
          errorStack: error.stack
        });
        
        // Robust error handling with reply safety
        const errorMessage = {
          content: 'There was an error while executing this command!',
          ephemeral: true
        };
        try {
          if (interaction.replied || interaction.deferred) {
            await interaction.followUp(errorMessage);
          } else {
            await interaction.reply(errorMessage);
          }
        } catch (replyError) {
          console.error('Could not send error message to user:', replyError);
        }
      }
    }
    
    // Handle button interactions
    else if (interaction.isButton()) {
      console.log(`Button interaction: ${interaction.customId}`);
      
      // Log interazione bottone
      logActivity('event', 'button_interaction', {
        customId: interaction.customId,
        userId: interaction.user.id,
        username: interaction.user.tag,
        guildId: interaction.guildId,
        guildName: interaction.guild?.name
      });
    }
    
    // Handle select menu interactions
    else if (interaction.isStringSelectMenu()) {
      console.log(`Select menu interaction: ${interaction.customId}`);
      
      // Log interazione menu
      logActivity('event', 'select_menu_interaction', {
        customId: interaction.customId,
        values: interaction.values,
        userId: interaction.user.id,
        username: interaction.user.tag,
        guildId: interaction.guildId,
        guildName: interaction.guild?.name
      });
    }
  },
};
