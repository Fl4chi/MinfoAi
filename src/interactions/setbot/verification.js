const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType, ModalBuilder, TextInputBuilder, TextInputStyle, PermissionsBitField } = require('discord.js');

// Helper functions that need to be imported or defined elsewhere
// These should be defined in a separate utility file or earlier in this file:
// - buildDashboard(interaction)
// - ensureConfig(interaction)
// - handleSelect(interaction, value)
// - handleComponent(interaction)
// - handleModals(interaction)
// - hasBotPermsInChannel(channel)

/**
 * Inizializza client.guildConfigs se non esiste
 * @param {Client} client - Il client Discord
 */
function initializeGuildConfigs(client) {
  if (!client) {
    throw new Error('Client object is required');
  }
  if (!client.guildConfigs) {
    client.guildConfigs = new Map();
    console.log('[Verification] Inizializzato client.guildConfigs');
  }
}

/**
 * Ottiene o crea la configurazione per una gilda
 * @param {Interaction} interaction - L'interazione Discord
 * @returns {Object} La configurazione della gilda
 */
function ensureGuildConfig(interaction) {
  if (!interaction || !interaction.client || !interaction.guild) {
    throw new Error('Invalid interaction, client, or guild');
  }

  const client = interaction.client;
  const guildId = interaction.guild.id;

  // Inizializza guildConfigs se necessario
  initializeGuildConfigs(client);

  // Ottieni o crea la configurazione per questa gilda
  if (!client.guildConfigs.has(guildId)) {
    client.guildConfigs.set(guildId, {
      verification: {
        enabled: false,
        roleId: null,
        channelId: null,
        messageId: null,
        logChannelId: null,
        title: '✅ Verifica',
        description: 'Clicca il pulsante per verificarti e ottenere accesso al server!',
        buttonText: 'Verifica',
        color: '#5865F2'
      },
      welcome: {},
      goodbye: {},
      moderation: {},
      music: {},
      gamification: {},
      giveaway: {}
    });
    console.log(`[Verification] Creata nuova configurazione per gilda ${guildId}`);
  }

  return client.guildConfigs.get(guildId);
}

module.exports = {
  // Entrypoint to render dashboard
  async handleVerification(interaction) {
    try {
      if (!interaction) {
        throw new Error('Interaction object is required');
      }

      // Assicurati che la configurazione esista
      ensureGuildConfig(interaction);

      const { embed, rows } = buildDashboard(interaction);
      
      if (!embed || !rows) {
        throw new Error('Dashboard build failed: missing embed or rows');
      }

      if (interaction.replied || interaction.deferred) {
        return await interaction.editReply({ embeds: [embed], components: rows });
      }
      return await interaction.reply({ embeds: [embed], components: rows, ephemeral: true });
    } catch (error) {
      console.error('Error in handleVerification:', error);
      const errorMessage = { content: '❌ Errore nel caricamento del pannello di verifica.', ephemeral: true };
      
      if (interaction.replied || interaction.deferred) {
        return await interaction.editReply(errorMessage).catch(() => {});
      }
      return await interaction.reply(errorMessage).catch(() => {});
    }
  },

  // Router for selects/buttons
  async onComponent(interaction) {
    try {
      if (!interaction || !interaction.customId) {
        throw new Error('Invalid interaction or missing customId');
      }

      // Assicurati che la configurazione esista
      ensureGuildConfig(interaction);

      const id = interaction.customId;
      
      if (id === 'verification_config_select') {
        const value = interaction.values?.[0];
        if (!value) {
          return await interaction.reply({ 
            content: '❌ Nessuna selezione valida.', 
            ephemeral: true 
          });
        }
        return await handleSelect(interaction, value);
      }
      
      return await handleComponent(interaction);
    } catch (error) {
      console.error('Error in onComponent:', error);
      const errorMessage = { content: '❌ Errore nell\'elaborazione del componente.', ephemeral: true };
      
      if (interaction.replied || interaction.deferred) {
        return await interaction.editReply(errorMessage).catch(() => {});
      }
      return await interaction.reply(errorMessage).catch(() => {});
    }
  },

  // Router for modals
  async onModal(interaction) {
    try {
      if (!interaction) {
        throw new Error('Invalid interaction');
      }

      // Assicurati che la configurazione esista
      ensureGuildConfig(interaction);

      return await handleModals(interaction);
    } catch (error) {
      console.error('Error in onModal:', error);
      const errorMessage = { content: '❌ Errore nell\'elaborazione del modal.', ephemeral: true };
      
      if (interaction.replied || interaction.deferred) {
        return await interaction.editReply(errorMessage).catch(() => {});
      }
      return await interaction.reply(errorMessage).catch(() => {});
    }
  },

  // Action when user clicks Verify button in published message
  async onVerify(interaction) {
    try {
      // Validate interaction object
      if (!interaction || !interaction.member || !interaction.guild) {
        throw new Error('Invalid interaction, member, or guild');
      }

      // Check if interaction is already replied to prevent duplicate responses
      if (interaction.replied || interaction.deferred) {
        return;
      }

      // Assicurati che la configurazione esista
      const cfg = ensureGuildConfig(interaction);

      if (!cfg || !cfg.verification) {
        return await interaction.reply({ 
          content: '❌ Configurazione non trovata.', 
          ephemeral: true 
        });
      }

      const v = cfg.verification;
      
      // Validate role configuration
      if (!v.roleId) {
        return await interaction.reply({ 
          content: '⚠️ Ruolo non configurato.', 
          ephemeral: true 
        });
      }

      // Check if user already has the role
      if (interaction.member.roles.cache.has(v.roleId)) {
        return await interaction.reply({ 
          content: '✅ Hai già questo ruolo!', 
          ephemeral: true 
        });
      }

      // Validate role exists in guild
      const role = interaction.guild.roles.cache.get(v.roleId);
      if (!role) {
        return await interaction.reply({ 
          content: '❌ Il ruolo configurato non esiste più.', 
          ephemeral: true 
        });
      }

      // Check bot permissions
      const botMember = interaction.guild.members.me;
      if (!botMember) {
        throw new Error('Bot member not found in guild');
      }

      if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return await interaction.reply({ 
          content: '❌ Il bot non ha il permesso "Gestisci Ruoli".', 
          ephemeral: true 
        });
      }

      // Check role hierarchy
      if (role.position >= botMember.roles.highest.position) {
        return await interaction.reply({ 
          content: '❌ Il ruolo è troppo alto nella gerarchia per essere assegnato dal bot.', 
          ephemeral: true 
        });
      }

      // Assign role
      await interaction.member.roles.add(v.roleId, 'User verified');

      // Log verification if channel is configured
      if (v.logChannelId) {
        const log = interaction.guild.channels.cache.get(v.logChannelId);
        if (log && log.isTextBased() && hasBotPermsInChannel(log)) {
          const logEmbed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle('✅ Utente Verificato')
            .addFields(
              { name: 'Utente', value: `${interaction.user.tag} (${interaction.user.id})`, inline: true },
              { name: 'Ruolo', value: `<@&${v.roleId}>`, inline: true },
              { name: 'Data', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
            )
            .setTimestamp();
          
          await log.send({ embeds: [logEmbed] }).catch(err => {
            console.error('Failed to send verification log:', err);
          });
        }
      }

      return await interaction.reply({ 
        content: '✅ Verificato! Ruolo assegnato con successo.', 
        ephemeral: true 
      });
    } catch (error) {
      console.error('Error in onVerify:', error);
      
      // Determine appropriate error message
      let errorContent = '❌ Errore nell\'assegnazione del ruolo.';
      if (error.code === 50013) {
        errorContent = '❌ Il bot non ha i permessi necessari per assegnare questo ruolo.';
      } else if (error.code === 10011) {
        errorContent = '❌ Il ruolo non esiste più.';
      }
      
      if (interaction.replied || interaction.deferred) {
        return await interaction.editReply({ content: errorContent, ephemeral: true }).catch(() => {});
      }
      return await interaction.reply({ content: errorContent, ephemeral: true }).catch(() => {});
    }
  },

  async showPanel(interaction, config) {
    // Usa la funzione principale di rendering con gestione errori
    return await this.handleVerification(interaction);
  },

  // Esporta le funzioni di utilità per uso esterno
  initializeGuildConfigs,
  ensureGuildConfig
};
