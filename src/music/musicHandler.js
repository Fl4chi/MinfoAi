const { EmbedBuilder } = require('discord.js');

/**
 * Music Handler - Gestisce le funzionalità musicali del bot
 * Placeholder per future implementazioni di riproduzione musicale
 */

class MusicHandler {
  constructor() {
    this.queues = new Map(); // Map<guildId, Queue>
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
   * Aggiunge una canzone alla coda
   * @param {string} guildId - ID del server
   * @param {Object} song - Dati della canzone
   */
  addToQueue(guildId, song) {
    const queue = this.initQueue(guildId);
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
   * Pulisce la coda
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
   * Riproduce una canzone (placeholder)
   * @param {string} guildId - ID del server
   */
  async play(guildId) {
    const queue = this.getQueue(guildId);
    if (!queue || queue.songs.length === 0) {
      return { success: false, message: 'Nessuna canzone in coda' };
    }

    // Placeholder - implementazione futura con @discordjs/voice
    queue.playing = true;
    return { success: true, message: 'Riproduzione avviata (placeholder)' };
  }

  /**
   * Mette in pausa la riproduzione (placeholder)
   * @param {string} guildId - ID del server
   */
  pause(guildId) {
    const queue = this.getQueue(guildId);
    if (!queue || !queue.playing) {
      return { success: false, message: 'Nessuna riproduzione in corso' };
    }

    queue.playing = false;
    return { success: true, message: 'Riproduzione in pausa' };
  }

  /**
   * Riprende la riproduzione (placeholder)
   * @param {string} guildId - ID del server
   */
  resume(guildId) {
    const queue = this.getQueue(guildId);
    if (!queue) {
      return { success: false, message: 'Nessuna coda trovata' };
    }

    queue.playing = true;
    return { success: true, message: 'Riproduzione ripresa' };
  }

  /**
   * Salta alla prossima canzone (placeholder)
   * @param {string} guildId - ID del server
   */
  skip(guildId) {
    const queue = this.getQueue(guildId);
    if (!queue || queue.songs.length === 0) {
      return { success: false, message: 'Nessuna canzone da saltare' };
    }

    if (!queue.loop) {
      queue.songs.shift();
    }
    return { success: true, message: 'Canzone saltata' };
  }

  /**
   * Ferma la riproduzione e pulisce la coda
   * @param {string} guildId - ID del server
   */
  stop(guildId) {
    const queue = this.getQueue(guildId);
    if (!queue) {
      return { success: false, message: 'Nessuna riproduzione da fermare' };
    }

    this.clearQueue(guildId);
    queue.connection = null;
    queue.player = null;
    this.queues.delete(guildId);
    return { success: true, message: 'Riproduzione fermata' };
  }

  /**
   * Imposta il volume (placeholder)
   * @param {string} guildId - ID del server
   * @param {number} volume - Volume (0-100)
   */
  setVolume(guildId, volume) {
    const queue = this.getQueue(guildId);
    if (!queue) {
      return { success: false, message: 'Nessuna coda trovata' };
    }

    if (volume < 0 || volume > 100) {
      return { success: false, message: 'Volume deve essere tra 0 e 100' };
    }

    queue.volume = volume;
    return { success: true, message: `Volume impostato a ${volume}%` };
  }

  /**
   * Attiva/disattiva il loop
   * @param {string} guildId - ID del server
   */
  toggleLoop(guildId) {
    const queue = this.getQueue(guildId);
    if (!queue) {
      return { success: false, message: 'Nessuna coda trovata' };
    }

    queue.loop = !queue.loop;
    return { success: true, message: `Loop ${queue.loop ? 'attivato' : 'disattivato'}` };
  }

  /**
   * Crea un embed con la coda corrente
   * @param {string} guildId - ID del server
   */
  getQueueEmbed(guildId) {
    const queue = this.getQueue(guildId);
    if (!queue || queue.songs.length === 0) {
      return new EmbedBuilder()
        .setTitle('🎵 Coda Musicale')
        .setDescription('La coda è vuota')
        .setColor('#ff0000');
    }

    const embed = new EmbedBuilder()
      .setTitle('🎵 Coda Musicale')
      .setColor('#00ff00')
      .addFields(
        { name: 'In Riproduzione', value: queue.songs[0]?.title || 'Nessuna', inline: false },
        { name: 'Volume', value: `${queue.volume}%`, inline: true },
        { name: 'Loop', value: queue.loop ? '✅ Attivo' : '❌ Disattivo', inline: true },
        { name: 'Stato', value: queue.playing ? '▶️ In Riproduzione' : '⏸️ In Pausa', inline: true }
      );

    if (queue.songs.length > 1) {
      const upcoming = queue.songs.slice(1, 6).map((song, i) => `${i + 1}. ${song.title}`).join('\n');
      embed.addFields({ name: 'Prossime Canzoni', value: upcoming || 'Nessuna', inline: false });
    }

    return embed;
  }

  /**
   * Mischia la coda
   * @param {string} guildId - ID del server
   */
  shuffle(guildId) {
    const queue = this.getQueue(guildId);
    if (!queue || queue.songs.length <= 1) {
      return { success: false, message: 'Non ci sono abbastanza canzoni da mischiare' };
    }

    const currentSong = queue.songs.shift();
    for (let i = queue.songs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [queue.songs[i], queue.songs[j]] = [queue.songs[j], queue.songs[i]];
    }
    queue.songs.unshift(currentSong);

    return { success: true, message: 'Coda mischiata' };
  }
}

module.exports = new MusicHandler();
