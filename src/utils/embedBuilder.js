const { EmbedBuilder } = require('discord.js');

class CustomEmbedBuilder {
  static success(title, description) {
    return new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle(title)
      .setDescription(description)
      .setTimestamp();
  }

  static error(title, description) {
    return new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle(title)
      .setDescription(description)
      .setTimestamp();
  }

  static info(title, description) {
    return new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle(title)
      .setDescription(description)
      .setTimestamp();
  }

  static warning(title, description) {
    return new EmbedBuilder()
      .setColor(0xFFFF00)
      .setTitle(title)
      .setDescription(description)
      .setTimestamp();
  }

  static partnership(data) {
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('🤝 Partnership Request')
      .setDescription(data.description || 'Nuova richiesta di partnership!')
      .setTimestamp();

    if (data.serverName) embed.addFields({ name: 'Server', value: data.serverName, inline: true });
    if (data.memberCount) embed.addFields({ name: 'Membri', value: data.memberCount.toString(), inline: true });
    if (data.invite) embed.addFields({ name: 'Invito', value: data.invite, inline: false });

    return embed;
  }
}

module.exports = CustomEmbedBuilder;
