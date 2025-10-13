// Dashboard Goodbye Embed Customization — ensure every interaction is acknowledged and errors handled robustly
const db = require('../../database/db');
const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
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
  // Initialize all properties with defaults to avoid undefined
  cfg.goodbyeEnabled = cfg.goodbyeEnabled ?? false;
  cfg.goodbyeChannelId = cfg.goodbyeChannelId ?? null;
  cfg.goodbyeMessage = cfg.goodbyeMessage ?? 'Addio {user}!';
  return cfg;
}

function buildDashboard(interaction) {
  const cfg = ensureConfig(interaction);
  const chOptions = getTextChannels(interaction);
  
  const embed = new EmbedBuilder()
    .setTitle('⚙️ Dashboard Goodbye')
    .setColor(cfg.goodbyeEnabled ? 0x00ff00 : 0xff0000)
    .setDescription(
      `**Status:** ${cfg.goodbyeEnabled ? '✅ Attivo' : '❌ Disattivo'}\n` +
        `**Canale:** ${cfg.goodbyeChannelId ? `<#${cfg.goodbyeChannelId}>` : 'Nessuno'}\n` +
        `**Messaggio:**\n\`\`\`${cfg.goodbyeMessage || 'Nessuno'}\`\`\`\n` +
        `*Variabili disponibili:* \`{user}\`, \`{server}\`, \`{memberCount}\``
    )
    .setTimestamp()
    .setFooter({ text: 'Dashboard aggiornata' });

  const rows = [];
  
  // Only add channel select menu if channels are available
  if (chOptions.length > 0) {
    const channelMenu = new StringSelectMenuBuilder()
      .setCustomId('goodbye_channel_select')
      .setPlaceholder('Seleziona canale goodbye')
      .addOptions(chOptions);
    rows.push(new ActionRowBuilder().addComponents(channelMenu));
  }
  
  return { embed, rows };
}

async function persistAndRefresh(interaction, partialUpdate) {
  try {
    // Update DB
    await db.updateGuildConfig(interaction.guildId, partialUpdate);
    
    // Refresh cache
    const freshCfg = await db.getGuildConfig(interaction.guildId);
    if (freshCfg && interaction.client.guildConfigs?.set) {
      interaction.client.guildConfigs.set(interaction.guildId, freshCfg);
    }
    
    // Build and send updated dashboard
    const { embed, rows } = buildDashboard(interaction);
    
    if (!interaction.replied && !interaction.deferred) {
      return interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
    } else {
      return interaction.editReply({ embeds: [embed], components: rows });
    }
  } catch (error) {
    console.error('[goodbye] Error in persistAndRefresh:', error);
    const errorMsg = { content: "❌ Errore durante l'aggiornamento.", embeds: [], components: [] };
    
    if (!interaction.replied && !interaction.deferred) {
      return interaction.reply({ ...errorMsg, ephemeral: true }).catch(() => {});
    } else {
      return interaction.editReply(errorMsg).catch(() => {});
    }
  }
}

async function handleSelect(interaction, channelId) {
  try {
    return persistAndRefresh(interaction, { goodbyeChannelId: channelId });
  } catch (error) {
    console.error('[goodbye] Error in handleSelect:', error);
    return interaction.editReply({ content: "❌ Errore durante l'aggiornamento.", embeds: [], components: [] }).catch(() => {});
  }
}

async function handleModals(interaction) {
  try {
    const id = interaction.customId;
    if (id === 'goodbye_message_modal') {
      const msg = interaction.fields.getTextInputValue('goodbye_msg_input');
      return persistAndRefresh(interaction, { goodbyeMessage: msg });
    }
  } catch (error) {
    console.error('[goodbye] Error in handleModals:', error);
    return interaction.editReply({ content: "❌ Errore durante l'aggiornamento del messaggio.", embeds: [], components: [] }).catch(() => {});
  }
}

module.exports = {
  async execute(interaction) {
    try {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: true });
      }
      const { embed, rows } = buildDashboard(interaction);
      return interaction.editReply({ embeds: [embed], components: rows });
    } catch (error) {
      console.error('[goodbye] Error in execute:', error);
      if (!interaction.replied && !interaction.deferred) {
        return interaction.reply({ content: "❌ Errore nell'esecuzione.", ephemeral: true }).catch(() => {});
      }
      return interaction.editReply({ content: "❌ Errore nell'esecuzione." }).catch(() => {});
    }
  },

  async handleGoodbye(interaction) {
    return this.execute(interaction);
  },

  async onComponent(interaction) {
    try {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferUpdate();
      }
      
      const id = interaction.customId;
      
      // Handle channel selection
      if (id === 'goodbye_channel_select') {
        const v = interaction.values?.[0];
        if (v === undefined) {
          return interaction.editReply({ content: '❌ Nessun canale selezionato.' }).catch(() => {});
        }
        return handleSelect(interaction, v);
      }
    } catch (error) {
      console.error('[goodbye] Error in onComponent:', error);
      if (!interaction.replied && !interaction.deferred) {
        return interaction.reply({ content: "❌ Errore nell'interazione.", ephemeral: true }).catch(() => {});
      }
      return interaction.editReply({ content: "❌ Errore nell'interazione." }).catch(() => {});
    }
  },

  async onModal(interaction) {
    try {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: true });
      }
      return handleModals(interaction);
    } catch (error) {
      console.error('[goodbye] Error in onModal:', error);
      if (!interaction.replied && !interaction.deferred) {
        return interaction.reply({ content: '❌ Errore nella gestione del modal.', ephemeral: true }).catch(() => {});
      }
      return interaction.editReply({ content: '❌ Errore nella gestione del modal.' }).catch(() => {});
    }
  },

  async showPanel(interaction, config) {
    return this.execute(interaction);
  },
};
