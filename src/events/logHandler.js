// src/events/logHandler.js
// Advanced logging handler for moderation and general events.
// Supports output to: Discord channels (webhook or channel ID), file, and database adapters.
// Runtime-configurable via a provided config provider (e.g., dashboard) that can be hot-reloaded.

const fs = require('fs');
const path = require('path');

class LogHandler {
  constructor(client, options = {}) {
    this.client = client;

    // Config provider must expose get() and on('change', cb)
    this.config = options.configProvider || {
      get: (k, d) => d,
      on: () => {}
    };

    this.adapters = {
      discord: this._sendDiscord.bind(this),
      file: this._writeFile.bind(this),
      db: this._writeDb.bind(this)
    };

    this.db = options.db || null; // optional database adapter with insert(collection, doc)

    // Preload cache of settings
    this.settings = this._loadSettings();

    // Support hot-reload from dashboard
    if (this.config.on) {
      this.config.on('change', () => {
        this.settings = this._loadSettings();
      });
    }

    // Maintain a ring buffer of recent events for botstatus
    this.recentEvents = [];
    this.maxRecent = 50;
  }

  _loadSettings() {
    return {
      enabled: this.config.get('logs.enabled', true),
      destinations: this.config.get('logs.destinations', ['discord', 'file']),
      discord: {
        channelId: this.config.get('logs.discord.channelId', null),
        webhookUrl: this.config.get('logs.discord.webhookUrl', null)
      },
      file: {
        enabled: true,
        dir: this.config.get('logs.file.dir', 'logs'),
        filename: this.config.get('logs.file.filename', 'moderation.log')
      },
      db: {
        collection: this.config.get('logs.db.collection', 'logs')
      },
      filters: this.config.get('logs.filters', {}), // e.g., { messageDelete: true }
      formatting: this.config.get('logs.formatting', { timestamp: true })
    };
  }

  _format(entry) {
    const ts = new Date(entry.timestamp || Date.now()).toISOString();
    const base = `[#${entry.type}] ${entry.summary}`;
    return this.settings.formatting.timestamp ? `[${ts}] ${base}` : base;
  }

  async log(type, payload = {}) {
    if (!this.settings.enabled) return;
    if (this.settings.filters && this.settings.filters[type] === false) return;

    const entry = {
      type,
      payload,
      guildId: payload.guildId || payload.guild?.id || null,
      userId: payload.userId || payload.targetId || payload.executorId || null,
      summary: this._summary(type, payload),
      timestamp: Date.now()
    };

    // ring buffer
    this.recentEvents.push(entry);
    if (this.recentEvents.length > this.maxRecent) this.recentEvents.shift();

    // fan-out
    const destinations = this.settings.destinations || [];
    const errors = [];
    await Promise.all(destinations.map(async dest => {
      try {
        await this.adapters[dest]?.(entry);
      } catch (e) {
        errors.push({ dest, error: e.message });
      }
    }));

    if (errors.length) {
      // Always also write errors locally
      try { this._writeFile({ type: 'error', summary: `Log dispatch errors: ${JSON.stringify(errors)}` }); } catch {}
    }

    return entry;
  }

  _summary(type, p) {
    switch (type) {
      case 'ban': return `Ban: ${p.targetTag || p.targetId} by ${p.executorTag || p.executorId} | reason: ${p.reason || 'n/a'}`;
      case 'kick': return `Kick: ${p.targetTag || p.targetId} by ${p.executorTag || p.executorId} | reason: ${p.reason || 'n/a'}`;
      case 'mute': return `Mute: ${p.targetTag || p.targetId} by ${p.executorTag || p.executorId} | duration: ${p.duration || 'n/a'} | reason: ${p.reason || 'n/a'}`;
      case 'warn': return `Warn: ${p.targetTag || p.targetId} by ${p.executorTag || p.executorId} | reason: ${p.reason || 'n/a'}`;
      case 'purge': return `Purge: ${p.amount} messages by ${p.executorTag || p.executorId} in #${p.channelName || p.channelId}`;
      case 'messageEdit': return `Edit by ${p.authorTag || p.authorId} in #${p.channelName || p.channelId}`;
      case 'messageDelete': return `Delete by ${p.authorTag || p.authorId} in #${p.channelName || p.channelId}`;
      case 'memberJoin': return `Join: ${p.memberTag || p.memberId}`;
      case 'memberLeave': return `Leave: ${p.memberTag || p.memberId}`;
      case 'levelUp': return `Level up: ${p.memberTag || p.memberId} -> ${p.level}`;
      case 'giveawayStart': return `Giveaway started: ${p.prize} in #${p.channelName || p.channelId}`;
      case 'giveawayEnd': return `Giveaway ended: ${p.prize} winners: ${Array.isArray(p.winners)?p.winners.length:'n/a'}`;
      case 'custom': return `Custom: ${p.message || 'n/a'} by ${p.executorTag || p.executorId || 'system'}`;
      default: return `${type}: ${p.message || p.reason || 'event'}`;
    }
  }

  async _sendDiscord(entry) {
    const content = this._format(entry);
    const { webhookUrl, channelId } = this.settings.discord || {};

    // Prefer webhook
    if (webhookUrl) {
      try {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content })
        });
        return;
      } catch (e) {
        // fallthrough to channel if available
      }
    }

    // Fallback to channel send via client if available
    if (channelId && this.client?.channels?.cache?.get) {
      const ch = this.client.channels.cache.get(channelId);
      if (ch && ch.send) {
        await ch.send({ content });
      }
    }
  }

  async _writeFile(entry) {
    const { dir, filename } = this.settings.file || {};
    if (!dir || !filename) return;
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const filePath = path.join(dir, filename);
      fs.appendFileSync(filePath, this._format(entry) + '\n', 'utf8');
    } catch {}
  }

  async _writeDb(entry) {
    if (!this.db?.insert) return;
    try {
      await this.db.insert(this.settings.db.collection, entry);
    } catch {}
  }

  // Helper: expose recent events for botstatus
  getRecent(count = 10) {
    return this.recentEvents.slice(Math.max(0, this.recentEvents.length - count));
  }
}

module.exports = LogHandler;
