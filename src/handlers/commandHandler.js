const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

module.exports = async (client) => {
  const commandsPath = path.join(__dirname, '..', 'commands');
  
  const commandFolders = fs.readdirSync(commandsPath).filter(f => {
    return fs.statSync(path.join(commandsPath, f)).isDirectory();
  });

  for (const folder of commandFolders) {
    const files = fs.readdirSync(path.join(commandsPath, folder)).filter(f => f.endsWith('.js'));
    
    for (const file of files) {
      const command = require(path.join(commandsPath, folder, file));
      if (command.data && command.execute) {
        client.commands.set(command.data.name, command);
        logger.success(`Loaded command: ${command.data.name}`);
      }
    }
  }
};
