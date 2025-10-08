const fs = require('fs');
const path = require('path');

async function loadCommands(client, commandsPath) {
  if (!fs.existsSync(commandsPath)) return;
  const files = fs.readdirSync(commandsPath, { withFileTypes: true });
  for (const file of files) {
    const full = path.join(commandsPath, file.name);
    if (file.isDirectory()) {
      await loadCommands(client, full);
      continue;
    }
    if (!file.name.endsWith('.js')) continue;
    const cmd = require(full);
    if (cmd?.data?.name && typeof cmd.execute === 'function') {
      client.commands.set(cmd.data.name, cmd);
    }
  }
  console.log(`[MinfoAi] Loaded ${client.commands.size} commands`);
}

async function loadEvents(client, eventsPath) {
  if (!fs.existsSync(eventsPath)) return;
  const files = fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'));
  for (const file of files) {
    const event = require(path.join(eventsPath, file));
    if (!event?.name || !event?.execute) continue;
    if (event.once) client.once(event.name, (...args) => event.execute(client, ...args));
    else client.on(event.name, (...args) => event.execute(client, ...args));
  }
  console.log(`[MinfoAi] Loaded ${files.length} events`);
}

module.exports = { loadCommands, loadEvents };
