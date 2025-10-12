const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionsBitField } = require('discord.js');

// ========== HELPER FUNCTIONS ==========

function ensureConfig(interaction) {
  let cfg = interaction.client.guildConfigs.get(interaction.guildId);
  if (!cfg) {
    cfg = {};
    interaction.client.guildConfigs.set(interaction.guildId, cfg);
  }
  if (!cfg.verification) {
    cfg.verification = {
      enabled: false,
      roleId: null,
      channelId: null,
      logChannelId: null,
      messageTitle: 'Verifica Account',
      messageDescription: 'Clicca il pulsante qui sotto per verificare il tuo account e ottenere l\'accesso completo al server.',
      buttonLabel: 'Verifica',
      timeoutSec: 0
    };
  }
  return cfg;
}

function hasBotPermsInChannel(channel) {
  if (!channel) return false;
  const perms = channel.permissionsFor(channel.guild.members.me);
  return perms && perms.has([PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]);
}

function buildDashboard(interaction) {
  const cfg = ensureConfig(interaction);
  const verification = cfg.verification;

  // Build embed
  const embed = new EmbedBuilder()
    .setTitle('⚙️ Verifica - Configurazione')
    .setColor(verification.enabled ? 0x00FF00 : 0xFF0000)
    .setDescription(
      `**Stato:** ${verification.enabled ? '✅ Attivo' : '❌ Disattivo'}\n` +
      `**Ruolo:** ${verification.roleId ? `<@&${verification.roleId}>` : 'Non impostato'}\n` +
      `**Canale Verifica:** ${verification.channelId ? `<#${verification.channelId}>` : 'Non impostato'}\n` +
      `**Canale Log:** ${verification.logChannelId ? `<#${verification.logChannelId}>` : 'Non impostato'}\n` +
      `**Timeout:** ${verification.timeoutSec > 0 ? `${verification.timeoutSec}s` : 'Nessuno'}\n\n` +
      `**Titolo Messaggio:** ${verification.messageTitle}\n` +
      `**Descrizione:** ${verification.messageDescription}\n` +
      `**Testo Bottone:** ${verification.buttonLabel}`
    )
    .setFooter({ text: 'Usa il menu qui sotto per configurare' })
    .setTimestamp();

  // Build select menu
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('verification_config_select')
    .setPlaceholder('Seleziona un\'opzione da configurare')
    .addOptions([
      { label: 'Abilita/Disabilita Verifica', value: 'toggle_enabled', emoji: '🔄' },
      { label: 'Imposta Ruolo', value: 'set_role', emoji: '🎭' },
      { label: 'Imposta Canale Verifica', value: 'set_channel', emoji: '#️⃣' },
      { label: 'Imposta Canale Log', value: 'set_log_channel', emoji: '📝' },
      { label: 'Imposta Timeout', value: 'set_timeout', emoji: '⏱️' },
      { label: 'Personalizza Messaggio', value: 'customize_message', emoji: '✏️' },
      { label: 'Pubblica Messaggio Verifica', value: 'publish_message', emoji: '📤' }
    ]);

  const row1 = new ActionRowBuilder().addComponents(selectMenu);

  // Build buttons
  const backButton = new ButtonBuilder()
    .setCustomId('setbot_back')
    .setLabel('🔙 Indietro')
    .setStyle(ButtonStyle.Secondary);

  const row2 = new ActionRowBuilder().addComponents(backButton);

  return { embed, rows: [row1, row2] };
}

async function handleSelect(interaction, value) {
  const cfg = ensureConfig(interaction);
  const verification = cfg.verification;

  switch (value) {
    case 'toggle_enabled':
      verification.enabled = !verification.enabled;
      interaction.client.guildConfigs.set(interaction.guildId, cfg);
      await interaction.deferUpdate();
      const { embed, rows } = buildDashboard(interaction);
      return interaction.editReply({ embeds: [embed], components: rows });

    case 'set_role':
      return interaction.reply({
        content: '🎭 Menziona il ruolo da assegnare (es: @Verified) o scrivi "cancella" per rimuoverlo.',
        ephemeral: true
      });

    case 'set_channel':
      return interaction.reply({
        content: '#️⃣ Menziona il canale dove pubblicare il messaggio di verifica (es: #verifica) o scrivi "cancella" per rimuoverlo.',
        ephemeral: true
      });

    case 'set_log_channel':
      return interaction.reply({
        content: '📝 Menziona il canale per i log delle verifiche (es: #mod-log) o scrivi "cancella" per rimuoverlo.',
        ephemeral: true
      });

    case 'set_timeout':
      const modal = new ModalBuilder()
        .setCustomId('verification_timeout_modal')
        .setTitle('Imposta Timeout Verifica');

      const timeoutInput = new TextInputBuilder()
        .setCustomId('timeout_value')
        .setLabel('Timeout in secondi (0 = nessun timeout)')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('es: 300 (5 minuti)')
        .setValue(verification.timeoutSec.toString())
        .setRequired(true);

      modal.addComponents(new ActionRowBuilder().addComponents(timeoutInput));
      return interaction.showModal(modal);

    case 'customize_message':
      const msgModal = new ModalBuilder()
        .setCustomId('verification_message_modal')
        .setTitle('Personalizza Messaggio Verifica');

      const titleInput = new TextInputBuilder()
        .setCustomId('message_title')
        .setLabel('Titolo')
        .setStyle(TextInputStyle.Short)
        .setValue(verification.messageTitle)
        .setRequired(true);

      const descInput = new TextInputBuilder()
        .setCustomId('message_description')
        .setLabel('Descrizione')
        .setStyle(TextInputStyle.Paragraph)
        .setValue(verification.messageDescription)
        .setRequired(true);

      const buttonInput = new TextInputBuilder()
        .setCustomId('button_label')
        .setLabel('Testo del Bottone')
        .setStyle(TextInputStyle.Short)
        .setValue(verification.buttonLabel)
        .setRequired(true);

      msgModal.addComponents(
        new ActionRowBuilder().addComponents(titleInput),
        new ActionRowBuilder().addComponents(descInput),
        new ActionRowBuilder().addComponents(buttonInput)
      );
      return interaction.showModal(msgModal);

    case 'publish_message':
      if (!verification.channelId) {
        return interaction.reply({
          content: '❌ Imposta prima un canale per la verifica!',
          ephemeral: true
        });
      }

      if (!verification.roleId) {
        return interaction.reply({
          content: '❌ Imposta prima un ruolo da assegnare!',
          ephemeral: true
        });
      }

      const channel = interaction.guild.channels.cache.get(verification.channelId);
      if (!channel) {
        return interaction.reply({
          content: '❌ Canale non trovato!',
          ephemeral: true
        });
      }

      if (!hasBotPermsInChannel(channel)) {
        return interaction.reply({
          content: '❌ Il bot non ha i permessi per scrivere in quel canale!',
          ephemeral: true
        });
      }

      const verifyEmbed = new EmbedBuilder()
        .setTitle(verification.messageTitle)
        .setDescription(verification.messageDescription)
        .setColor(0x00FF00)
        .setTimestamp();

      const verifyButton = new ButtonBuilder()
        .setCustomId('verify_button')
        .setLabel(verification.buttonLabel)
        .setStyle(ButtonStyle.Success)
        .setEmoji('✅');

      const verifyRow = new ActionRowBuilder().addComponents(verifyButton);

      try {
        await channel.send({ embeds: [verifyEmbed], components: [verifyRow] });
        return interaction.reply({
          content: '✅ Messaggio di verifica pubblicato con successo!',
          ephemeral: true
        });
      } catch (err) {
        return interaction.reply({
          content: '❌ Errore nella pubblicazione del messaggio. Verifica i permessi del bot.',
          ephemeral: true
        });
      }

    default:
      return interaction.reply({ content: 'Opzione non riconosciuta.', ephemeral: true });
  }
}

async function handleComponent(interaction) {
  // Handle other button clicks
  return interaction.reply({ content: 'Funzione in sviluppo.', ephemeral: true });
}

async function handleModals(interaction) {
  const cfg = ensureConfig(interaction);
  const verification = cfg.verification;

  if (interaction.customId === 'verification_timeout_modal') {
    const n = parseInt(interaction.fields.getTextInputValue('timeout_value'), 10);
    if (isNaN(n) || n < 0) {
      return interaction.reply({ content: '❌ Valore non valido. Inserisci un numero >= 0.', ephemeral: true });
    }
    verification.timeoutSec = n;
  }

  if (interaction.customId === 'verification_message_modal') {
    verification.messageTitle = interaction.fields.getTextInputValue('message_title');
    verification.messageDescription = interaction.fields.getTextInputValue('message_description');
    verification.buttonLabel = interaction.fields.getTextInputValue('button_label');
  }

  interaction.client.guildConfigs.set(interaction.guildId, cfg);
  const { embed, rows } = buildDashboard(interaction);
  return interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
}

module.exports = {
  // Entrypoint to render dashboard
  async handleVerification(interaction) {
    const { embed, rows } = buildDashboard(interaction);
    if (interaction.replied || interaction.deferred) {
      return interaction.editReply({ embeds: [embed], components: rows });
    }
    return interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
  },

  // Router for selects/buttons
  async onComponent(interaction) {
    const id = interaction.customId;
    if (id === 'verification_config_select') {
      const v = interaction.values?.[0];
      return handleSelect(interaction, v);
    }
    return handleComponent(interaction);
  },

  // Router for modals
  async onModal(interaction) {
    return handleModals(interaction);
  },

  // Action when user clicks Verify button in published message
  async onVerify(interaction) {
    const cfg = ensureConfig(interaction);
    const v = cfg.verification;

    if (!v.roleId) return interaction.reply({ content: 'Ruolo non configurato.', ephemeral: true });

    try {
      await interaction.member.roles.add(v.roleId, 'User verified');
      if (v.logChannelId) {
        const log = interaction.guild.channels.cache.get(v.logChannelId);
        if (log && hasBotPermsInChannel(log)) {
          const msg = `${interaction.user.tag} (${interaction.user.id}) verificato. Ruolo assegnato.`;
          log.send({ content: msg }).catch(() => {});
        }
      }
      return interaction.reply({ content: '✅ Verificato! Ruolo assegnato.', ephemeral: true });
    } catch (e) {
      return interaction.reply({ content: 'Errore nell\'assegnazione del ruolo. Controlla i permessi.', ephemeral: true });
    }
  }
};
