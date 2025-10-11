const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');

module.exports = {
  async handleVerification(interaction) {
    const guildId = interaction.guildId;
    const config = interaction.client.guildConfigs.get(guildId) || {};
    const verificationConfig = config.verification || {};

    const embed = new EmbedBuilder()
      .setTitle('⚙️ Configurazione Verifica')
      .setDescription('Configura il sistema di verifica per i nuovi membri del server.')
      .setColor('#00ff00')
      .addFields(
        { name: 'Stato', value: verificationConfig.enabled ? '✅ Attivo' : '❌ Disattivo', inline: true },
        { name: 'Canale Verifica', value: verificationConfig.channelId ? `<#${verificationConfig.channelId}>` : 'Non configurato', inline: true },
        { name: 'Ruolo Verificato', value: verificationConfig.roleId ? `<@&${verificationConfig.roleId}>` : 'Non configurato', inline: true },
        { name: 'Tipo Verifica', value: verificationConfig.type || 'button', inline: true },
        { name: 'Messaggio Personalizzato', value: verificationConfig.customMessage ? 'Configurato' : 'Non configurato', inline: true }
      )
      .setFooter({ text: 'Usa i pulsanti qui sotto per configurare la verifica' });

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('verification_config_select')
      .setPlaceholder('Seleziona un\'opzione da configurare')
      .addOptions([
        {
          label: 'Abilita/Disabilita Verifica',
          description: 'Attiva o disattiva il sistema di verifica',
          value: 'verification_toggle',
          emoji: '🔄'
        },
        {
          label: 'Imposta Canale Verifica',
          description: 'Scegli il canale dove appare il messaggio di verifica',
          value: 'verification_channel',
          emoji: '📢'
        },
        {
          label: 'Imposta Ruolo Verificato',
          description: 'Scegli il ruolo da assegnare dopo la verifica',
          value: 'verification_role',
          emoji: '👤'
        },
        {
          label: 'Tipo di Verifica',
          description: 'Scegli il tipo di verifica (bottone, captcha, etc.)',
          value: 'verification_type',
          emoji: '⚙️'
        },
        {
          label: 'Messaggio Personalizzato',
          description: 'Personalizza il messaggio di verifica',
          value: 'verification_message',
          emoji: '✏️'
        },
        {
          label: 'Invia Messaggio Verifica',
          description: 'Invia il messaggio di verifica nel canale configurato',
          value: 'verification_send',
          emoji: '📤'
        }
      ]);

    const backButton = new ButtonBuilder()
      .setCustomId('back_to_main')
      .setLabel('Indietro')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji('◀️');

    const row1 = new ActionRowBuilder().addComponents(selectMenu);
    const row2 = new ActionRowBuilder().addComponents(backButton);

    await interaction.update({
      embeds: [embed],
      components: [row1, row2],
      ephemeral: true
    });
  },

  async handleVerificationConfig(interaction) {
    const selectedOption = interaction.values[0];
    const guildId = interaction.guildId;

    switch(selectedOption) {
      case 'verification_toggle':
        await this.toggleVerification(interaction, guildId);
        break;
      case 'verification_channel':
        await this.setVerificationChannel(interaction, guildId);
        break;
      case 'verification_role':
        await this.setVerificationRole(interaction, guildId);
        break;
      case 'verification_type':
        await this.setVerificationType(interaction, guildId);
        break;
      case 'verification_message':
        await this.setVerificationMessage(interaction, guildId);
        break;
      case 'verification_send':
        await this.sendVerificationMessage(interaction, guildId);
        break;
    }
  },

  async toggleVerification(interaction, guildId) {
    const config = interaction.client.guildConfigs.get(guildId) || {};
    if (!config.verification) config.verification = {};
    
    config.verification.enabled = !config.verification.enabled;
    interaction.client.guildConfigs.set(guildId, config);

    await interaction.reply({
      content: `✅ Sistema di verifica ${config.verification.enabled ? 'attivato' : 'disattivato'}!`,
      ephemeral: true
    });
  },

  async setVerificationChannel(interaction, guildId) {
    const channels = interaction.guild.channels.cache
      .filter(c => c.type === ChannelType.GuildText)
      .map(c => ({
        label: c.name,
        value: c.id,
        description: `ID: ${c.id}`
      }))
      .slice(0, 25);

    if (channels.length === 0) {
      return await interaction.reply({
        content: '❌ Nessun canale testuale trovato!',
        ephemeral: true
      });
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('verification_channel_select')
      .setPlaceholder('Seleziona il canale per la verifica')
      .addOptions(channels);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
      content: '📢 Seleziona il canale dove verrà inviato il messaggio di verifica:',
      components: [row],
      ephemeral: true
    });
  },

  async setVerificationRole(interaction, guildId) {
    const roles = interaction.guild.roles.cache
      .filter(r => !r.managed && r.id !== interaction.guild.id)
      .map(r => ({
        label: r.name,
        value: r.id,
        description: `ID: ${r.id}`
      }))
      .slice(0, 25);

    if (roles.length === 0) {
      return await interaction.reply({
        content: '❌ Nessun ruolo disponibile!',
        ephemeral: true
      });
    }

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('verification_role_select')
      .setPlaceholder('Seleziona il ruolo da assegnare')
      .addOptions(roles);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
      content: '👤 Seleziona il ruolo da assegnare ai membri verificati:',
      components: [row],
      ephemeral: true
    });
  },

  async setVerificationType(interaction, guildId) {
    const types = [
      { label: 'Bottone Semplice', value: 'button', description: 'Clicca un bottone per verificarti', emoji: '🔘' },
      { label: 'Captcha', value: 'captcha', description: 'Risolvi un captcha per verificarti', emoji: '🔢' },
      { label: 'Reazione', value: 'reaction', description: 'Reagisci a un messaggio per verificarti', emoji: '👍' }
    ];

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('verification_type_select')
      .setPlaceholder('Seleziona il tipo di verifica')
      .addOptions(types);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await interaction.reply({
      content: '⚙️ Seleziona il tipo di verifica:',
      components: [row],
      ephemeral: true
    });
  },

  async setVerificationMessage(interaction, guildId) {
    await interaction.reply({
      content: '✏️ Questa funzione verrà implementata a breve. Per ora viene usato il messaggio predefinito.',
      ephemeral: true
    });
  },

  async sendVerificationMessage(interaction, guildId) {
    const config = interaction.client.guildConfigs.get(guildId) || {};
    const verificationConfig = config.verification || {};

    if (!verificationConfig.enabled) {
      return await interaction.reply({
        content: '❌ Il sistema di verifica non è attivo! Attivalo prima di inviare il messaggio.',
        ephemeral: true
      });
    }

    if (!verificationConfig.channelId) {
      return await interaction.reply({
        content: '❌ Non hai configurato un canale per la verifica!',
        ephemeral: true
      });
    }

    const channel = interaction.guild.channels.cache.get(verificationConfig.channelId);
    if (!channel) {
      return await interaction.reply({
        content: '❌ Il canale configurato non esiste più!',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('✅ Verifica Account')
      .setDescription(verificationConfig.customMessage || 'Clicca il bottone qui sotto per verificare il tuo account e accedere al server!')
      .setColor('#00ff00')
      .setFooter({ text: interaction.guild.name });

    const verifyButton = new ButtonBuilder()
      .setCustomId('verify_member')
      .setLabel('Verifica')
      .setStyle(ButtonStyle.Success)
      .setEmoji('✅');

    const row = new ActionRowBuilder().addComponents(verifyButton);

    try {
      await channel.send({ embeds: [embed], components: [row] });
      await interaction.reply({
        content: '✅ Messaggio di verifica inviato con successo!',
        ephemeral: true
      });
    } catch (error) {
      console.error('Errore nell\'invio del messaggio di verifica:', error);
      await interaction.reply({
        content: '❌ Errore nell\'invio del messaggio. Controlla i permessi del bot nel canale!',
        ephemeral: true
      });
    }
  },

  async handleVerifyButton(interaction) {
    const guildId = interaction.guildId;
    const config = interaction.client.guildConfigs.get(guildId) || {};
    const verificationConfig = config.verification || {};

    if (!verificationConfig.roleId) {
      return await interaction.reply({
        content: '❌ Il ruolo di verifica non è configurato!',
        ephemeral: true
      });
    }

    const role = interaction.guild.roles.cache.get(verificationConfig.roleId);
    if (!role) {
      return await interaction.reply({
        content: '❌ Il ruolo configurato non esiste più!',
        ephemeral: true
      });
    }

    try {
      await interaction.member.roles.add(role);
      await interaction.reply({
        content: `✅ Verificato con successo! Ti è stato assegnato il ruolo ${role.name}.`,
        ephemeral: true
      });
    } catch (error) {
      console.error('Errore nell\'assegnazione del ruolo:', error);
      await interaction.reply({
        content: '❌ Errore nell\'assegnazione del ruolo. Controlla i permessi del bot!',
        ephemeral: true
      });
    }
  }
};
