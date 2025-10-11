// src/commands/botstatus.js
// Terminal command to print bot runtime info to console: uptime, users, guilds, commands executed, memory, recent logs

const os = require('os');

module.exports = {
  name: 'botstatus',
  description: 'Print bot runtime status in the terminal console',

  // Intended to be invoked via your internal command dispatcher (not a Discord slash command)
  // Example: from a dev console or an admin-only message leading to console output.
  execute({ client, logHandler, metrics }) {
    const now = Date.now();
    const upMs = process.uptime() * 1000;
    const uptime = new Date(upMs).toISOString().substr(11, 8);

    const guildCount = client.guilds?.cache?.size || 0;
    const userCount = client.users?.cache?.size || 0;
    const channelCount = client.channels?.cache?.size || 0;

    const mem = process.memoryUsage();
    const cpuLoad = os.loadavg?.()[0]?.toFixed(2);

    const executedCommands = metrics?.commandsExecuted || 0;
    const errorsCount = metrics?.errors || 0;

    const recent = logHandler?.getRecent?.(10) || [];

    const info = {
      timestamp: new Date(now).toISOString(),
      uptime,
      pid: process.pid,
      node: process.version,
      platform: `${process.platform} ${process.arch}`,
      cpuLoad,
      memory: {
        rssMB: (mem.rss / 1024 / 1024).toFixed(1),
        heapUsedMB: (mem.heapUsed / 1024 / 1024).toFixed(1),
        heapTotalMB: (mem.heapTotal / 1024 / 1024).toFixed(1)
      },
      guilds: guildCount,
      users: userCount,
      channels: channelCount,
      commandsExecuted: executedCommands,
      errors: errorsCount,
      recentEvents: recent.map(e => ({ type: e.type, summary: e.summary, at: new Date(e.timestamp).toISOString() }))
    };

    // Pretty print
    // eslint-disable-next-line no-console
    console.log('=== Bot Status ===');
    // eslint-disable-next-line no-console
    console.dir(info, { depth: 3, colors: true });

    return info;
  }
};
