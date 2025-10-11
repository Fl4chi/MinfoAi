const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

/**
 * Music Handler - Gestisce le funzionalità musicali del bot
 * Include: setup canale musica, comando /play, impostazioni DJ, volume e limiti coda
 */
class MusicHandler {
  constructor() {
    this.queues = new Map(); // Map<guildId, queue>
    this.musicChannels = new Map(); // Map<guildId, channelId>
    this.djRoles = new Map(); // Map<guildId, roleId>
    this.maxQueueSize = 50; // Limite massimo coda
  }

  /**
   * Imposta il canale musica per un server
   * @param {string} guildId - ID del server
   * @param {string} channelId - ID del canale vocale
   */
  setupMusicChannel(guildId, channelId) {
    this.musicChannels.set(guildId, channelId);
    return true;
  }

  /**
   * Ottiene il canale musica configurato
   * @param {string} guildId - ID del server
   */
  getMusicChannel(guildId) {
    return this.musicChannels.get(guildId);
  }

  /**
   * Imposta il ruolo DJ per un server
   * @param {string} guildId - ID del server
   * @param {string} roleId - ID del ruolo DJ
   */
  setDJRole(guildId, roleId) {
    this.djRoles.set(guildId, roleId);
    return true;
  }

  /**
   * Verifica se un utente ha i permessi DJ
   * @param {GuildMember} member - Membro del server
   * @param {string} guildId - ID del server
   */
  hasDJPermission(member, guildId) {
    const djRole = this.djRoles.get(guildId);
    if (!djRole) return true; // Se non c'è ruolo DJ, tutti possono usare i comandi
    return member.roles.cache.has(djRole) || member.permissions.has(PermissionFlagsBits.Administrator);
  }

  /**
   * Inizializza la coda musicale per un server
   * @param {string} guildId - ID del server
   */
  initQueue(guildId) {
    if (!this.queues.has(guildId)) {
      this.queues.set(guildId, {
        songs: [],
        volume: 50,
        playing: false,
        loop: false,
        connection: null,
        player: null
      });
    }
    return this.queues.get(guildId);
  }

  /**
   * Ottiene la coda per un server
   * @param {string} guildId - ID del server
   */
  getQueue(guildId) {
    return this.queues.get(guildId);
  }

  /**
   * Aggiunge una canzone alla coda con controllo limiti
   * @param {string} guildId - ID del server
   * @param {Object} song - Dati della canzone
   */
  addToQueue(guildId, song) {
    const queue = this.initQueue(guildId);
    
    // Controllo limite coda
    if (queue.songs.length >= this.maxQueueSize) {
      throw new Error(`La coda ha raggiunto il limite massimo di ${this.maxQueueSize} canzoni`);
    }
    
    queue.songs.push(song);
    return queue.songs.length;
  }

  /**
   * Rimuove una canzone dalla coda
   * @param {string} guildId - ID del server
   * @param {number} index - Indice della canzone
   */
  removeFromQueue(guildId, index) {
    const queue = this.getQueue(guildId);
    if (!queue || index < 0 || index >= queue.songs.length) {
      return null;
    }
    return queue.songs.splice(index, 1)[0];
  }

  /**
   * Imposta il volume per un server
   * @param {string} guildId - ID del server
   * @param {number} volume - Volume (0-100)
   */
  setVolume(guildId, volume) {
    const queue = this.getQueue(guildId);
    if (!queue) return false;
    
    // Limita il volume tra 0 e 100
    volume = Math.max(0, Math.min(100, volume));
    queue.volume = volume;
    
    // Aggiorna il volume del player se sta riproducendo
    if (queue.player && queue.playing) {
      queue.player.volume = volume / 100;
    }
    
    return true;
  }

  /**
   * Ottiene il volume corrente
   * @param {string} guildId - ID del server
   */
  getVolume(guildId) {
    const queue = this.getQueue(guildId);
    return queue ? queue.volume : 50;
  }

  /**
   * Comando /play - Riproduce una canzone
   * @param {Interaction} interaction - Interazione Discord
   * @param {string} query - Query di ricerca o URL
   */
  async handlePlayCommand(interaction, query) {
    const member = interaction.member;
    const guildId = interaction.guildId;
    
    // Verifica permessi DJ
    if (!this.hasDJPermission(member, guildId)) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#FF0000')
          .setDescription('❌ Non hai i permessi DJ per usare questo comando!')],
        ephemeral: true
      });
    }
    
    // Verifica che l'utente sia in un canale vocale
    const voiceChannel = member.voice.channel;
    if (!voiceChannel) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#FF0000')
          .setDescription('❌ Devi essere in un canale vocale per riprodurre musica!')],
        ephemeral: true
      });
    }
    
    // Verifica il canale musica configurato (se presente)
    const musicChannelId = this.getMusicChannel(guildId);
    if (musicChannelId && voiceChannel.id !== musicChannelId) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#FF0000')
          .setDescription(`❌ Puoi riprodurre musica solo nel canale <#${musicChannelId}>!`)],
        ephemeral: true
      });
    }
    
    try {
      // Inizializza la coda
      const queue = this.initQueue(guildId);
      
      // Crea oggetto canzone (placeholder - richiederebbe integrazione con API musica)
      const song = {
        title: query,
        url: query,
        duration: '0:00',
        requester: member.user.tag
      };
      
      // Aggiungi alla coda
      const position = this.addToQueue(guildId, song);
      
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTitle('🎵 Canzone aggiunta alla coda')
        .setDescription(`**${song.title}**`)
        .addFields(
          { name: 'Richiesta da', value: song.requester, inline: true },
          { name: 'Posizione', value: position.toString(), inline: true }
        );
      
      await interaction.reply({ embeds: [embed] });
      
      // Se non sta già riproducendo, inizia la riproduzione
      if (!queue.playing) {
        // Placeholder per avviare la riproduzione
        // Richiederebbe integrazione con discord-player o simili
      }
      
    } catch (error) {
      return interaction.reply({
        embeds: [new EmbedBuilder()
          .setColor('#FF0000')
          .setDescription(`❌ Errore: ${error.message}`)],
        ephemeral: true
      });
    }
  }

  /**
   * Pulisce la coda di un server
   * @param {string} guildId - ID del server
   */
  clearQueue(guildId) {
    const queue = this.getQueue(guildId);
    if (queue) {
      queue.songs = [];
      queue.playing = false;
    }
  }

  /**
   * Rimuove completamente la coda di un server
   * @param {string} guildId - ID del server
   */
  deleteQueue(guildId) {
    this.queues.delete(guildId);
  }
}

module.exports = new MusicHandler();
