// Dashboard Goodbye Embed Customization
const db = require('../../database/db');
const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
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

function replaceVariables(text, user) {
  return text
    .replace(/{user}/gi, user.username)
    .replace(/{mention}/gi, `<@${user.id}>`)
    .replace(/{server}/gi, user.guild?.name || 'Server');
}

function buildEmbed(cfg, interaction) {
  const channel = cfg.goodbyeChannelId
    ? interaction.guild.channels.cache.get(cfg.goodbyeChannelId)
    : null;

  const variablesText =
    '**Variabili disponibili:**\n' +
    '`{user}` → Nome utente\n' +
    '`{mention}` → Menzione utente\n' +
    '`{server}` → Nome server';

  const embed = new EmbedBuilder()
    .setTitle('⚙️ Configurazione Goodbye')
    .setColor(cfg.goodbyeEnabled ? 0x00ff00 : 0xff0000)
    .addFields(
      {
        name: '📌 Stato',
        value: cfg.goodbyeEnabled ? '✅ Attivo' : '❌ Disattivo',
        inline: true,
      },
      {
        name: '📢 Canale',
        value: channel ? `<#${channel.id}>` : '❌ Non impostato',
        inline: true,
      },
      {
        name: '💬 Messaggio',
        value: `\`\`\`${cfg.goodbyeMessage}\`\`\``,
        inline: false,
      },
      {
        name: '🔧 Variabili',
        value: variablesText,
        inline: false,
      }
    )
    .setFooter({ text: 'Sistema Goodbye • Aggiornamento automatico' })
    .setTimestamp();

  return embed;
}

function buildComponents(cfg, channels) {
  // Row 1: Channel Dropdown
  const channelMenu = new StringSelectMenuBuilder()
    .setCustomId('goodbye_channel_select')
    .setPlaceholder('🔽 Seleziona canale goodbye')
    .addOptions(
      channels.length > 0
        ? channels
        : [{ label: 'Nessun canale disponibile', value: 'none' }]
    )
    .setDisabled(channels.length === 0);

  if (cfg.goodbyeChannelId && channels.find((c) => c.value === cfg.goodbyeChannelId)) {
    channelMenu.setPlaceholder(`✅ ${channels.find((c) => c.value === cfg.goodbyeChannelId).label}`);
  }

  const row1 = new ActionRowBuilder().addComponents(channelMenu);

  // Row 2: Control Buttons
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('goodbye_toggle')
      .setLabel(cfg.goodbyeEnabled ? '🟢 ON' : '🔴 OFF')
      .setStyle(cfg.goodbyeEnabled ? ButtonStyle.Success : ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('goodbye_reset')
      .setLabel('🔄 Ripristina')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('goodbye_message')
      .setLabel('✏️ Messaggio')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('goodbye_preview')
      .setLabel('👁️ Anteprima')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!cfg.goodbyeEnabled || !cfg.goodbyeChannelId)
  );

  return [row1, row2];
}

module.exports = {
  data: {
    name: 'goodbye',
    description: 'Configura messaggi goodbye personalizzati',
  },
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const cfg = ensureConfig(interaction);
      const channels = getTextChannels(interaction);

      const embed = buildEmbed(cfg, interaction);
      const components = buildComponents(cfg, channels);

      await interaction.editReply({
        embeds: [embed],
        components: components,
      });
    } catch (error) {
      console.error('[goodbye] Error in execute:', error);
      const errorMsg = {
        content: '❌ Errore durante l\'apertura del pannello goodbye.',
        ephemeral: true,
      };
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(errorMsg).catch(() => {});
      } else {
        await interaction.reply(errorMsg).catch(() => {});
      }
    }
  },
  async handleInteraction(interaction) {
    try {
      const cfg = ensureConfig(interaction);
      const channels = getTextChannels(interaction);

      if (interaction.customId === 'goodbye_channel_select') {
        const channelId = interaction.values[0];
        if (channelId === 'none') {
          await interaction.reply({
            content: '❌ Nessun canale valido selezionato.',
            ephemeral: true,
          });
          return;
        }

        cfg.goodbyeChannelId = channelId;
        interaction.client.guildConfigs.set(interaction.guildId, cfg);
        await db.upsertGuild(cfg);

        await interaction.update({
          embeds: [buildEmbed(cfg, interaction)],
          components: buildComponents(cfg, channels),
        });
        return;
      }

      if (interaction.customId === 'goodbye_toggle') {
        cfg.goodbyeEnabled = !cfg.goodbyeEnabled;
        interaction.client.guildConfigs.set(interaction.guildId, cfg);
        await db.upsertGuild(cfg);

        await interaction.update({
          embeds: [buildEmbed(cfg, interaction)],
          components: buildComponents(cfg, channels),
        });
        return;
      }

      if (interaction.customId === 'goodbye_reset') {
        cfg.goodbyeEnabled = false;
        cfg.goodbyeChannelId = null;
        cfg.goodbyeMessage = 'Addio {user}!';
        interaction.client.guildConfigs.set(interaction.guildId, cfg);
        await db.upsertGuild(cfg);

        await interaction.update({
          embeds: [buildEmbed(cfg, interaction)],
          components: buildComponents(cfg, channels),
        });
        return;
      }

      if (interaction.customId === 'goodbye_message') {
        const modal = {
          title: 'Modifica Messaggio Goodbye',
          custom_id: 'goodbye_message_modal',
          components: [
            {
              type: 1,
              components: [
                {
                  type: 4,
                  custom_id: 'goodbye_message_input',
                  label: 'Messaggio Goodbye',
                  style: 2,
                  value: cfg.goodbyeMessage,
                  required: true,
                  max_length: 1000,
                  placeholder: 'Esempio: Addio {user}, ci mancherai!',
                },
              ],
            },
          ],
        };
        await interaction.showModal(modal);
        return;
      }

      if (interaction.customId === 'goodbye_preview') {
        if (!cfg.goodbyeEnabled || !cfg.goodbyeChannelId) {
          await interaction.reply({
            content: '❌ Configura canale e attiva il sistema prima dell\'anteprima.',
            ephemeral: true,
          });
          return;
        }

        const previewMessage = replaceVariables(cfg.goodbyeMessage, interaction.user);
        const previewEmbed = new EmbedBuilder()
          .setTitle('👁️ Anteprima Goodbye')
          .setDescription(previewMessage)
          .setColor(0x00aaff)
          .setFooter({ text: 'Questa è un\'anteprima del messaggio goodbye' })
          .setTimestamp();

        await interaction.reply({
          embeds: [previewEmbed],
          ephemeral: true,
        });
        return;
      }

      if (interaction.customId === 'goodbye_message_modal') {
        const newMessage = interaction.fields.getTextInputValue('goodbye_message_input');
        cfg.goodbyeMessage = newMessage;
        interaction.client.guildConfigs.set(interaction.guildId, cfg);
        await db.upsertGuild(cfg);

        await interaction.update({
          embeds: [buildEmbed(cfg, interaction)],
          components: buildComponents(cfg, channels),
        });
        return;
      }
    } catch (error) {
      console.error('[goodbye] Error in handleInteraction:', error);
      const errorMsg = {
        content: '❌ Errore durante l\'aggiornamento della configurazione.',
        ephemeral: true,
      };
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(errorMsg).catch(() => {});
      } else {
        await interaction.reply(errorMsg).catch(() => {});
      }
    }
  },
};
