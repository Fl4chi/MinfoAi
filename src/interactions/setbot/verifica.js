// Verifica Embed Configuration
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
    console.error('[verifica] Error fetching channels:', error);
    return [];
  }
}

function ensureConfig(interaction) {
  let cfg = interaction.client.guildConfigs?.get(interaction.guildId);
  if (!cfg) {
    cfg = {
      guildId: interaction.guildId,
      verificaEnabled: false,
      verificaChannelId: null,
      verificaTitle: 'Verifica',
      verificaMessage: 'Completa la verifica per accedere.',
      verificaFooter: 'Sistema Verifica',
      verificaRoles: [], // array di role IDs opzionali
    };
    interaction.client.guildConfigs?.set?.(interaction.guildId, cfg);
  }
  cfg.verificaEnabled = cfg.verificaEnabled ?? false;
  cfg.verificaChannelId = cfg.verificaChannelId ?? null;
  cfg.verificaTitle = cfg.verificaTitle ?? 'Verifica';
  cfg.verificaMessage = cfg.verificaMessage ?? 'Completa la verifica per accedere.';
  cfg.verificaFooter = cfg.verificaFooter ?? 'Sistema Verifica';
  cfg.verificaRoles = Array.isArray(cfg.verificaRoles) ? cfg.verificaRoles : [];
  return cfg;
}

function replaceVariables(text, interaction) {
  const user = interaction.user;
  return String(text)
    .replace(/{user}/gi, user.username)
    .replace(/{mention}/gi, `<@${user.id}>`)
    .replace(/{server}/gi, interaction.guild?.name || 'Server');
}

function buildEmbed(cfg, interaction) {
  const channel = cfg.verificaChannelId
    ? interaction.guild.channels.cache.get(cfg.verificaChannelId)
    : null;

  const variablesText =
    '**Variabili disponibili:**\n' +
    '`{user}` → Nome utente\n' +
    '`{mention}` → Menzione utente\n' +
    '`{server}` → Nome server';

  const embed = new EmbedBuilder()
    .setTitle(cfg.verificaTitle || 'Verifica')
    .setDescription(cfg.verificaMessage || 'Completa la verifica per accedere.')
    .setColor(cfg.verificaEnabled ? 0x00ff88 : 0xff5555)
    .setFooter({ text: cfg.verificaFooter || 'Sistema Verifica' })
    .addFields(
      {
        name: '📌 Stato',
        value: cfg.verificaEnabled ? '✅ Attivo' : '❌ Disattivo',
        inline: true,
      },
      {
        name: '📢 Canale',
        value: channel ? `<#${channel.id}>` : '❌ Non impostato',
        inline: true,
      },
      {
        name: '🎯 Ruoli',
        value: cfg.verificaRoles.length ? cfg.verificaRoles.map((r) => `<@&${r}>`).join(', ') : 'Nessun ruolo',
        inline: false,
      },
      {
        name: '🔧 Variabili',
        value: variablesText,
        inline: false,
      }
    )
    .setTimestamp();

  return embed;
}

function buildComponents(cfg, channels) {
  // Menu canale (solo select canale, niente altro)
  const channelMenu = new StringSelectMenuBuilder()
    .setCustomId('verifica_channel_select')
    .setPlaceholder('🔽 Seleziona canale verifica')
    .addOptions(
      channels.length > 0
        ? channels
        : [{ label: 'Nessun canale disponibile', value: 'none' }]
    )
    .setDisabled(channels.length === 0);

  if (cfg.verificaChannelId && channels.find((c) => c.value === cfg.verificaChannelId)) {
    channelMenu.setPlaceholder(`✅ ${channels.find((c) => c.value === cfg.verificaChannelId).label}`);
  }

  const row1 = new ActionRowBuilder().addComponents(channelMenu);

  // 4 Bottoni: On/Off, Ripristina, Messaggio (embed/ruoli/titolo/footer), Anteprima
  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('verifica_toggle')
      .setLabel(cfg.verificaEnabled ? '🟢 ON' : '🔴 OFF')
      .setStyle(cfg.verificaEnabled ? ButtonStyle.Success : ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId('verifica_reset')
      .setLabel('🔄 Ripristina')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('verifica_message')
      .setLabel('✏️ Messaggio/Embed')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('verifica_preview')
      .setLabel('👁️ Anteprima')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(!cfg.verificaEnabled || !cfg.verificaChannelId)
  );

  return [row1, row2];
}

module.exports = {
  data: {
    name: 'verifica',
    description: 'Configura embed verifica: canale, stato, messaggio, ruoli, titolo e footer',
  },

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const cfg = ensureConfig(interaction);
      const channels = getTextChannels(interaction);
      const embed = buildEmbed(cfg, interaction);
      const components = buildComponents(cfg, channels);
      await interaction.editReply({ embeds: [embed], components });
    } catch (error) {
      console.error('[verifica] Error in execute:', error);
      const errorMsg = { content: "❌ Errore durante l'apertura del pannello verifica.", ephemeral: true };
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

      if (interaction.customId === 'verifica_channel_select') {
        const channelId = interaction.values?.[0];
        if (!channelId || channelId === 'none') {
          await interaction.reply({ content: '❌ Nessun canale valido selezionato.', ephemeral: true });
          return;
        }
        cfg.verificaChannelId = channelId;
        interaction.client.guildConfigs.set(interaction.guildId, cfg);
        await db.upsertGuild(cfg);
        await interaction.update({ embeds: [buildEmbed(cfg, interaction)], components: buildComponents(cfg, channels) });
        return;
      }

      if (interaction.customId === 'verifica_toggle') {
        cfg.verificaEnabled = !cfg.verificaEnabled;
        interaction.client.guildConfigs.set(interaction.guildId, cfg);
        await db.upsertGuild(cfg);
        await interaction.update({ embeds: [buildEmbed(cfg, interaction)], components: buildComponents(cfg, channels) });
        return;
      }

      if (interaction.customId === 'verifica_reset') {
        cfg.verificaEnabled = false;
        cfg.verificaChannelId = null;
        cfg.verificaTitle = 'Verifica';
        cfg.verificaMessage = 'Completa la verifica per accedere.';
        cfg.verificaFooter = 'Sistema Verifica';
        cfg.verificaRoles = [];
        interaction.client.guildConfigs.set(interaction.guildId, cfg);
        await db.upsertGuild(cfg);
        await interaction.update({ embeds: [buildEmbed(cfg, interaction)], components: buildComponents(cfg, channels) });
        return;
      }

      if (interaction.customId === 'verifica_message') {
        // Un singolo modal con campi per titolo, descrizione, footer e ruoli (lista ID separati da virgola)
        const modal = {
          title: 'Modifica Embed Verifica',
          custom_id: 'verifica_message_modal',
          components: [
            {
              type: 1,
              components: [
                { type: 4, custom_id: 'ver_title', label: 'Titolo', style: 1, value: cfg.verificaTitle || 'Verifica', required: true, max_length: 256 },
              ],
            },
            {
              type: 1,
              components: [
                { type: 4, custom_id: 'ver_desc', label: 'Messaggio (descrizione)', style: 2, value: cfg.verificaMessage || '', required: true, max_length: 1000, placeholder: 'Esempio: Benvenuto {user}, verifica per accedere a {server}.' },
              ],
            },
            {
              type: 1,
              components: [
                { type: 4, custom_id: 'ver_footer', label: 'Footer', style: 1, value: cfg.verificaFooter || 'Sistema Verifica', required: false, max_length: 256 },
              ],
            },
            {
              type: 1,
              components: [
                { type: 4, custom_id: 'ver_roles', label: 'Ruoli (ID separati da virgola)', style: 1, value: cfg.verificaRoles.join(','), required: false, max_length: 1000, placeholder: 'Esempio: 1234567890,9876543210' },
              ],
            },
          ],
        };
        await interaction.showModal(modal);
        return;
      }

      if (interaction.customId === 'verifica_preview') {
        if (!cfg.verificaEnabled || !cfg.verificaChannelId) {
          await interaction.reply({ content: "❌ Configura canale e attiva il sistema prima dell'anteprima.", ephemeral: true });
          return;
        }
        const desc = replaceVariables(cfg.verificaMessage, interaction);
        const previewEmbed = new EmbedBuilder()
          .setTitle(cfg.verificaTitle || 'Verifica')
          .setDescription(desc)
          .setFooter({ text: cfg.verificaFooter || 'Sistema Verifica' })
          .setColor(0x00aaff)
          .setTimestamp();
        await interaction.reply({ embeds: [previewEmbed], ephemeral: true });
        return;
      }

      if (interaction.customId === 'verifica_message_modal') {
        const title = interaction.fields.getTextInputValue('ver_title');
        const desc = interaction.fields.getTextInputValue('ver_desc');
        const footer = interaction.fields.getTextInputValue('ver_footer');
        const rolesRaw = interaction.fields.getTextInputValue('ver_roles');
        const roles = rolesRaw
          ? rolesRaw.split(',').map((s) => s.trim()).filter(Boolean)
          : [];

        cfg.verificaTitle = title;
        cfg.verificaMessage = desc;
        cfg.verificaFooter = footer;
        cfg.verificaRoles = roles;

        interaction.client.guildConfigs.set(interaction.guildId, cfg);
        await db.upsertGuild(cfg);
        await interaction.update({ embeds: [buildEmbed(cfg, interaction)], components: buildComponents(cfg, channels) });
        return;
      }
    } catch (error) {
      console.error('[verifica] Error in handleInteraction:', error);
      const errorMsg = { content: '❌ Errore durante l\'aggiornamento della configurazione.', ephemeral: true };
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(errorMsg).catch(() => {});
      } else {
        await interaction.reply(errorMsg).catch(() => {});
      }
    }
  },
};
