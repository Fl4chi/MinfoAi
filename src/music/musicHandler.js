const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../database/db');

/**
 * Music Handler - Manages music functionality with MongoDB config persistence
 * Queue management remains in-memory (ephemeral), settings are persisted
 */
class MusicHandler {
  constructor() {
    this.queues = new Map(); // Map<guildId, queue> - ephemeral
  }

  /**
   * Setup music channel for a server (persists to DB)
   */
  async setupMusicChannel(guildId, channelId) {
    await db.updateGuildConfig(guildId, { musicChannelId: channelId });
    return true;
  }

  /**
   * Get configured music channel
   */
  async getMusicChannel(guildId) {
    const config = await db.getGuildConfig(guildId);
    return config?.musicChannelId || null;
  }

  /**
   * Set DJ role for a server (persists to DB)
   */
  async setDJRole(guildId, roleId) {
    await db.updateGuildConfig(guildId, { djRoleId: roleId });
    return true;
  }

  /**
   * Check if user has DJ permission
   */
  async hasDJPermission(member, guildId) {
    const config = await db.getGuildConfig(guildId);
    const djRole = config?.djRoleId;
    if (!djRole) return true; // No DJ role = everyone can use commands
    return member.roles.cache.has(djRole) || member.permissions.has(PermissionFlagsBits.Administrator);
  }

  /**
   * Set max queue size (persists to DB)
   */
  async setMaxQueueSize(guildId, size) {
    await db.updateGuildConfig(guildId, { maxQueueSize: size });
    return true;
  }

  /**
   * Get max queue size
   */
  async getMaxQueueSize(guildId) {
    const config = await db.getGuildConfig(guildId);
    return config?.maxQueueSize || 100;
  }

  /**
   * Set default volume (persists to DB)
   */
  async setDefaultVolume(guildId, volume) {
    await db.updateGuildConfig(guildId, { defaultVolume: volume });
    return true;
  }

  /**
   * Get default volume
   */
  async getDefaultVolume(guildId) {
    const config = await db.getGuildConfig(guildId);
    return config?.defaultVolume || 50;
  }

  /**
   * Initialize queue for a server (ephemeral)
   */
  initQueue(guildId) {
    if (!this.queues.has(guildId)) {
      this.queues.set(guildId, {
        songs: [],
        playing: false,
        volume: 50,
        loop: false
      });
    }
    return this.queues.get(guildId);
  }

  /**
   * Get queue for a server
   */
  getQueue(guildId) {
    return this.queues.get(guildId) || null;
  }

  /**
   * Add song to queue
   */
  async addToQueue(guildId, song) {
    const queue = this.initQueue(guildId);
    const maxSize = await this.getMaxQueueSize(guildId);
    
    if (queue.songs.length >= maxSize) {
      throw new Error(`Queue is full (max ${maxSize} songs)`);
    }
    
    queue.songs.push(song);
    return queue.songs.length;
  }

  /**
   * Handle /play command
   */
  async handlePlayCommand(interaction) {
    try {
      const guildId = interaction.guild.id;
      const member = interaction.member;
      const query = interaction.options.getString('song');

      // Check DJ permission
      if (!(await this.hasDJPermission(member, guildId))) {
        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription('❌ You need the DJ role to use music commands')],
          ephemeral: true
        });
      }

      // Check if user is in voice channel
      if (!member.voice.channel) {
        return interaction.reply({
          embeds: [new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription('❌ You must be in a voice channel')],
          ephemeral: true
        });
      }

      const queue = this.initQueue(guildId);
      
      // Create song object (placeholder - would require music API integration)
      const song = {
        title: query,
        url: query,
        duration: '0:00',
        requester: member.user.tag
      };
      
      // Add to queue
      const position = await this.addToQueue(guildId, song);
      
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🎵 Song added to queue')
        .setDescription(`**${song.title}**`)
        .addFields(
          { name: 'Requested by', value: song.requester, inline: true },
          { name: 'Position', value: position.toString(), inline: true }
        );
      
      await interaction.reply({ embeds: [embed] });
      
      // If not playing, start playback (placeholder)
      if (!queue.playing) {
        // Would require discord-player or similar integration
      }
      
    } catch (error) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#FF0000')
          .setDescription(`❌ Error: ${error.message}`)],
        ephemeral: true
      });
    }
  }

  /**
   * Clear queue for a server
   */
  clearQueue(guildId) {
    const queue = this.getQueue(guildId);
    if (queue) {
      queue.songs = [];
      queue.playing = false;
    }
  }

  /**
   * Delete queue for a server
   */
  deleteQueue(guildId) {
    this.queues.delete(guildId);
  }
}

module.exports = new MusicHandler();
