const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

module.exports = async (client) => {
  const eventsPath = path.join(__dirname, '..', 'events');
  const eventFiles = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));

  for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    const eventName = event.name || file.split('.')[0];

    if (event.once) {
      client.once(eventName, (...args) => event.execute(...args, client));
    } else {
      client.on(eventName, (...args) => event.execute(...args, client));
    }
    
    logger.success(`Loaded event: ${eventName}`);
  }
};
