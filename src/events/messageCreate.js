const { Events } = require('discord.js');
const User = require('../database/models/User');
const Message = require('../database/models/Message');

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    // Ignora i bot
    if (message.author.bot) return;

    try {
      // Trova o crea l'utente
      let user = await User.findOne({ userId: message.author.id });
      if (!user) {
        user = new User({
          userId: message.author.id,
          username: message.author.username,
          xp: 0,
          level: 1,
          messageCount: 0
        });
      }

      // Incrementa il conteggio messaggi
      user.messageCount += 1;

      // Aggiungi XP (es. 10-25 XP per messaggio)
      const xpGain = Math.floor(Math.random() * 16) + 10;
      user.xp += xpGain;

      // Calcola XP necessario per il prossimo livello
      const xpRequired = user.level * 100;

      // Auto level-up
      if (user.xp >= xpRequired) {
        user.level += 1;
        user.xp = user.xp - xpRequired;

        // Messaggio di congratulazioni per il livello
        await message.channel.send(
          `🎉 Congratulazioni ${message.author}! Hai raggiunto il livello **${user.level}**!`
        );
      }

      // Salva l'utente nel database
      await user.save();

      // Log del messaggio nel database
      const messageLog = new Message({
        messageId: message.id,
        userId: message.author.id,
        channelId: message.channel.id,
        guildId: message.guild?.id || null,
        content: message.content,
        timestamp: message.createdAt
      });

      await messageLog.save();
    } catch (error) {
      console.error('Errore nel tracking del messaggio:', error);
    }
  }
};
