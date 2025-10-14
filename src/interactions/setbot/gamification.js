// Refactored: 2025-10-14 - Dashboard gamification con select menu unica e gestione errori robusta
// Architettura: select menu unica per tutte le configurazioni, embed preview stato, nessun bottone superfluo
const db = require('../../database/db');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType } = require('discord.js');

// Helper: get text channels
function getTextChannels(interaction) {
  return interaction.guild.channels.cache
    .filter(c => c.type === ChannelType.GuildText)
    .map(c => ({ label: `#${c.name}`, value: c.id }))
    .slice(0, 23); // Max 23 per lasciare spazio a "Nessuno"
}

// Helper: ensure config
function ensureConfig(interaction) {
  let cfg = interaction.client.guildConfigs.get(interaction.guildId);
  if (!cfg) {
    cfg = {
      guildId: interaction.guildId,
      gamificationEnabled: false,
      gamificationXpPerMessage: 5,
      gamificationXpCooldown: 60,
      gamificationLevelChannelId: null
    };
    interaction.client.guildConfigs.set(interaction.guildId, cfg);
  }
  if (cfg.gamificationXpPerMessage === undefined) cfg.gamificationXpPerMessage = 5;
  if (cfg.gamificationXpCooldown === undefined) cfg.gamificationXpCooldown = 60;
  return cfg;
}

// Build dashboard embed + single select menu
function buildDashboard(interaction) {
  const cfg = ensureConfig(interaction);
  const channels = getTextChannels(interaction);
  
  const embed = new EmbedBuilder()
    .setTitle('⚙️ Dashboard Gamification')
    .setColor(cfg.gamificationEnabled ? '#43B581' : '#ED4245')
    .setDescription(
      `**Sistema:** ${cfg.gamificationEnabled ? '🟢 Attivo' : '🔴 Disattivo'}\n` +
      `**XP per messaggio:** ${cfg.gamificationXpPerMessage}\n` +
      `**Cooldown XP:** ${cfg.gamificationXpCooldown}s\n` +
      `**Canale Level-Up:** ${cfg.gamificationLevelChannelId ? `<#${cfg.gamificationLevelChannelId}>` : 'Nessuno'}\n\n` +
      `*Usa il menu qui sotto per configurare il modulo*`
    )
    .setTimestamp();

  // Unica select menu per tutte le configurazioni
  const options = [
    { label: cfg.gamificationEnabled ? '🔴 Disabilita sistema' : '🟢 Abilita sistema', value: 'toggle_system', emoji: cfg.gamificationEnabled ? '❌' : '✅' },
    { label: '🎯 Imposta XP per messaggio', value: 'set_xp', emoji: '🎯' },
    { label: '⏱️ Imposta cooldown XP', value: 'set_cooldown', emoji: '⏱️' },
    { label: '📢 Imposta canale level-up', value: 'set_levelup_channel', emoji: '📢' }
  ];

  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('gamification_action_select')
    .setPlaceholder('Seleziona un\'azione...')
    .addOptions(options);

  const row = new ActionRowBuilder().addComponents(selectMenu);
  return { embed, rows: [row] };
}

// Handle select menu actions
async function handleSelect(interaction) {
  const action = interaction.values?.[0];
  if (!action) {
    await interaction.reply({ content: '❌ Azione non valida.', ephemeral: true });
    return;
  }

  const cfg = ensureConfig(interaction);

  try {
    if (action === 'toggle_system') {
      await interaction.deferUpdate();
      const newVal = !cfg.gamificationEnabled;
      cfg.gamificationEnabled = newVal;
      await db.updateGuildConfig(interaction.guildId, { gamificationEnabled: newVal });
      const freshCfg = await db.getGuildConfig(interaction.guildId);
      if (freshCfg) interaction.client.guildConfigs.set(interaction.guildId, freshCfg);
      const { embed, rows } = buildDashboard(interaction);
      return interaction.editReply({ embeds: [embed], components: rows });
    }

    if (action === 'set_xp') {
      const modal = new ModalBuilder()
        .setCustomId('gamification_xp_modal')
        .setTitle('Imposta XP per Messaggio');
      const input = new TextInputBuilder()
        .setCustomId('xp_value')
        .setLabel('XP per messaggio (1-100)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('5')
        .setValue(String(cfg.gamificationXpPerMessage || 5))
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(3);
      const row = new ActionRowBuilder().addComponents(input);
      modal.addComponents(row);
      return interaction.showModal(modal);
    }

    if (action === 'set_cooldown') {
      const modal = new ModalBuilder()
        .setCustomId('gamification_cooldown_modal')
        .setTitle('Imposta Cooldown XP');
      const input = new TextInputBuilder()
        .setCustomId('cooldown_value')
        .setLabel('Cooldown in secondi (0-3600)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('60')
        .setValue(String(cfg.gamificationXpCooldown || 60))
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(4);
      const row = new ActionRowBuilder().addComponents(input);
      modal.addComponents(row);
      return interaction.showModal(modal);
    }

    if (action === 'set_levelup_channel') {
      const channels = getTextChannels(interaction);
      if (channels.length === 0) {
        await interaction.reply({ content: '❌ Nessun canale testuale disponibile.', ephemeral: true });
        return;
      }
      const modal = new ModalBuilder()
        .setCustomId('gamification_channel_modal')
        .setTitle('Imposta Canale Level-Up');
      const input = new TextInputBuilder()
        .setCustomId('channel_id')
        .setLabel('ID Canale (o "none" per rimuovere)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder(cfg.gamificationLevelChannelId || 'none')
        .setValue(cfg.gamificationLevelChannelId || '')
        .setRequired(false);
      const row = new ActionRowBuilder().addComponents(input);
      modal.addComponents(row);
      return interaction.showModal(modal);
    }
  } catch (err) {
    console.error('[gamification.js] Errore handleSelect:', err);
    const reply = { content: `❌ Errore durante l'operazione: ${err.message}`, ephemeral: true };
    if (interaction.deferred || interaction.replied) {
      return interaction.editReply(reply).catch(() => {});
    } else {
      return interaction.reply(reply).catch(() => {});
    }
  }
}

// Handle modals
async function handleModals(interaction) {
  await interaction.deferUpdate();
  const cfg = ensureConfig(interaction);

  try {
    if (interaction.customId === 'gamification_xp_modal') {
      const xpInput = interaction.fields.getTextInputValue('xp_value');
      const xp = parseInt(xpInput, 10);
      if (isNaN(xp) || xp < 1 || xp > 100) {
        return interaction.editReply({ 
          content: '❌ XP non valido. Inserisci un numero tra 1 e 100.', 
          embeds: [], 
          components: [] 
        });
      }
      cfg.gamificationXpPerMessage = xp;
      await db.updateGuildConfig(interaction.guildId, { gamificationXpPerMessage: xp });
      const freshCfg = await db.getGuildConfig(interaction.guildId);
      if (freshCfg) interaction.client.guildConfigs.set(interaction.guildId, freshCfg);
      const { embed, rows } = buildDashboard(interaction);
      return interaction.editReply({ embeds: [embed], components: rows });
    }

    if (interaction.customId === 'gamification_cooldown_modal') {
      const cooldownInput = interaction.fields.getTextInputValue('cooldown_value');
      const cooldown = parseInt(cooldownInput, 10);
      if (isNaN(cooldown) || cooldown < 0 || cooldown > 3600) {
        return interaction.editReply({ 
          content: '❌ Cooldown non valido. Inserisci un numero tra 0 e 3600 secondi.', 
          embeds: [], 
          components: [] 
        });
      }
      cfg.gamificationXpCooldown = cooldown;
      await db.updateGuildConfig(interaction.guildId, { gamificationXpCooldown: cooldown });
      const freshCfg = await db.getGuildConfig(interaction.guildId);
      if (freshCfg) interaction.client.guildConfigs.set(interaction.guildId, freshCfg);
      const { embed, rows } = buildDashboard(interaction);
      return interaction.editReply({ embeds: [embed], components: rows });
    }

    if (interaction.customId === 'gamification_channel_modal') {
      const channelInput = interaction.fields.getTextInputValue('channel_id').trim();
      let newChannelId = null;
      
      if (channelInput && channelInput.toLowerCase() !== 'none') {
        // Verifica che il canale esista
        const channel = interaction.guild.channels.cache.get(channelInput);
        if (!channel || channel.type !== ChannelType.GuildText) {
          return interaction.editReply({ 
            content: '❌ Canale non valido. Assicurati di inserire un ID canale testuale valido o "none".', 
            embeds: [], 
            components: [] 
          });
        }
        newChannelId = channelInput;
      }
      
      cfg.gamificationLevelChannelId = newChannelId;
      await db.updateGuildConfig(interaction.guildId, { gamificationLevelChannelId: newChannelId });
      const freshCfg = await db.getGuildConfig(interaction.guildId);
      if (freshCfg) interaction.client.guildConfigs.set(interaction.guildId, freshCfg);
      const { embed, rows } = buildDashboard(interaction);
      return interaction.editReply({ embeds: [embed], components: rows });
    }
  } catch (err) {
    console.error('[gamification.js] Errore handleModals:', err);
    return interaction.editReply({ 
      content: `❌ Errore durante il salvataggio: ${err.message}`, 
      embeds: [], 
      components: [] 
    }).catch(() => {});
  }
}

module.exports = {
  async execute(interaction) { 
    if (typeof this.showPanel === 'function') return this.showPanel(interaction); 
    if (typeof this.handleGamification === 'function') return this.handleGamification(interaction); 
    return interaction.reply({ content: '❌ Dashboard modulo non implementata correttamente!', ephemeral: true }); 
  },
  
  // Entrypoint to render dashboard
  async handleGamification(interaction) {
    try {
      const { embed, rows } = buildDashboard(interaction);
      if (interaction.replied || interaction.deferred) {
        return interaction.editReply({ embeds: [embed], components: rows });
      }
      return interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
    } catch (err) {
      console.error('[gamification.js] Errore handleGamification:', err);
      const reply = { content: `❌ Errore caricamento dashboard: ${err.message}`, ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        return interaction.editReply(reply).catch(() => {});
      }
      return interaction.reply(reply).catch(() => {});
    }
  },
  
  // Router for select menu
  async onComponent(interaction) {
    try {
      if (interaction.customId === 'gamification_action_select') {
        return handleSelect(interaction);
      }
      // Fallback per custom ID non riconosciuti
      await interaction.reply({ content: '❌ Azione non riconosciuta.', ephemeral: true });
    } catch (err) {
      console.error('[gamification.js] Errore onComponent:', err);
      const reply = { content: `❌ Errore: ${err.message}`, ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        return interaction.editReply(reply).catch(() => {});
      }
      return interaction.reply(reply).catch(() => {});
    }
  },
  
  // Router for modals
  async onModal(interaction) {
    return handleModals(interaction);
  },
  
  // Alias for compatibility with setbot.js
  async showPanel(interaction, config) {
    return this.handleGamification(interaction);
  }
};
