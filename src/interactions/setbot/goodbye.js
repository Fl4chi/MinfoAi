// Dashboard Goodbye Embed Customization
const db = require('../../database/db');
const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ChannelType,
} = require('discord.js');

function getTextChannels(interaction) {
  try {
    return interaction.guild.channels.cache
      .filter((c) => c.type === ChannelType.GuildText)
      .map((c) => ({ label: `#${c.name}`, value: c.id }))
      .slice(0, 24);
  } catch (error) {
    console.error('[goodbye] Error fetching channels:', error);
    return [];
  }
}

function ensureConfig(interaction) {
  let cfg = interaction.client.guildConfigs?.get(interaction.guildId);
  if (!cfg) {
    cfg = {
      guildId: interaction.guildId,
      goodbyeEnabled: false,
      goodbyeChannelId: null,
      goodbyeMessage: 'Addio {user}!',
    };
    interaction.client.guildConfigs?.set?.(interaction.guildId, cfg);
  }
  // Initialize all properties with defaults
  cfg.goodbyeEnabled = cfg.goodbyeEnabled ?? false;
  cfg.goodbyeChannelId = cfg.goodbyeChannelId ?? null;
  cfg.goodbyeMessage = cfg.goodbyeMessage ?? 'Addio {user}!';
  return cfg;
}

function buildEmbed(cfg, interaction) {
  const embed = new EmbedBuilder()
    .setTitle('⚙️ Configurazione Goodbye')
    .setColor(cfg.goodbyeEnabled ? 0x00ff00 : 0xff6b6b)
    .setTimestamp()
    .setFooter({ text: `Configurato da ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });

  const statusEmoji = cfg.goodbyeEnabled ? '✅' : '❌';
  const statusText = cfg.goodbyeEnabled ? 'Attivo' : 'Disattivo';
  const channelText = cfg.goodbyeChannelId ? `<#${cfg.goodbyeChannelId}>` : 'Nessuno';
  const messagePreview = cfg.goodbyeMessage || 'Addio {user}!';

  embed.setDescription(
    `**Stato:** ${statusEmoji} ${statusText}\n` +
    `**Canale:** ${channelText}\n` +
    `**Messaggio:** ${messagePreview}\n\n` +
    `Usa il menu qui sotto per selezionare il canale goodbye.`
  );

  if (cfg.goodbyeEnabled && cfg.goodbyeChannelId) {
    embed.setImage('https://i.imgur.com/placeholder.png'); // Placeholder
  }

  return embed;
}

module.exports = {
  async execute(interaction, context) {
    try {
      const cfg = ensureConfig(interaction);

      if (interaction.isStringSelectMenu()) {
        if (interaction.customId === 'goodbye_channel_select') {
          const channelId = interaction.values[0];
          if (channelId === 'disable') {
            cfg.goodbyeEnabled = false;
            cfg.goodbyeChannelId = null;
            await db.run(
              'UPDATE guild_config SET goodbyeEnabled = ?, goodbyeChannelId = ? WHERE guildId = ?',
              [0, null, interaction.guildId]
            );
            interaction.client.guildConfigs?.set(interaction.guildId, cfg);
            const embed = buildEmbed(cfg, interaction);
            const row = new ActionRowBuilder().addComponents(
              new StringSelectMenuBuilder()
                .setCustomId('goodbye_channel_select')
                .setPlaceholder('Seleziona canale goodbye')
                .addOptions(
                  { label: '🚫 Disabilita Goodbye', value: 'disable' },
                  ...getTextChannels(interaction)
                )
            );
            await interaction.update({ embeds: [embed], components: [row] });
            return;
          }

          const channel = interaction.guild.channels.cache.get(channelId);
          if (!channel) {
            await interaction.reply({ content: '❌ Canale non trovato.', ephemeral: true });
            return;
          }

          cfg.goodbyeEnabled = true;
          cfg.goodbyeChannelId = channelId;
          await db.run(
            'UPDATE guild_config SET goodbyeEnabled = ?, goodbyeChannelId = ? WHERE guildId = ?',
            [1, channelId, interaction.guildId]
          );
          interaction.client.guildConfigs?.set(interaction.guildId, cfg);

          const embed = buildEmbed(cfg, interaction);
          const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId('goodbye_channel_select')
              .setPlaceholder('Seleziona canale goodbye')
              .addOptions(
                { label: '🚫 Disabilita Goodbye', value: 'disable' },
                ...getTextChannels(interaction)
              )
          );
          await interaction.update({ embeds: [embed], components: [row] });
          return;
        }
      }

      // Initial render
      const embed = buildEmbed(cfg, interaction);
      const channels = getTextChannels(interaction);
      if (channels.length === 0) {
        await interaction.reply({ content: '❌ Nessun canale testuale trovato.', ephemeral: true });
        return;
      }

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('goodbye_channel_select')
          .setPlaceholder('Seleziona canale goodbye')
          .addOptions(
            { label: '🚫 Disabilita Goodbye', value: 'disable' },
            ...channels
          )
      );

      await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    } catch (error) {
      console.error('[goodbye] Fatal error:', error);
      const errorMsg = '❌ Errore durante la configurazione del goodbye.';
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: errorMsg, ephemeral: true }).catch(() => {});
      } else {
        await interaction.reply({ content: errorMsg, ephemeral: true }).catch(() => {});
      }
    }
  },
};
