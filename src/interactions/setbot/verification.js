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
  initializeGuildConfigs(client);

  if (!client.guildConfigs.has(guildId)) {
    const newConfig = {
      verification: {
        enabled: false,
        channelId: null,
        roleId: null,
        logChannelId: null,
        messageId: null
      },
      welcome: { enabled: false },
      goodbye: { enabled: false },
      moderation: { enabled: false },
      gamification: { enabled: false },
      music: { enabled: false },
      giveaway: { enabled: false }
    };
    client.guildConfigs.set(guildId, newConfig);
    console.log(`[Verification] Creata nuova configurazione per gilda ${guildId}`);
  }
  return client.guildConfigs.get(guildId);
}

/**
 * Verifica se il bot ha i permessi necessari in un canale
 * @param {Channel} channel - Il canale da verificare
 * @returns {boolean} true se il bot ha i permessi necessari
 */
function hasBotPermsInChannel(channel) {
  if (!channel || !channel.guild) return false;
  const botMember = channel.guild.members.me;
  if (!botMember) return false;
  const perms = channel.permissionsFor(botMember);
  return perms && perms.has([PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]);
}

module.exports = {
  async handleVerification(interaction) {
    try {
      const config = ensureGuildConfig(interaction);
      const v = config.verification;

      // Validation checks
      if (!v.enabled) {
        return await interaction.reply({
          content: '❌ Il sistema di verifica non è abilitato. Usa /setbot verification per configurarlo.',
          ephemeral: true
        });
      }

      if (!v.roleId) {
        return await interaction.reply({
          content: '❌ Nessun ruolo di verifica configurato.',
          ephemeral: true
        });
      }

      const role = interaction.guild.roles.cache.get(v.roleId);
      if (!role) {
        return await interaction.reply({
          content: '❌ Il ruolo configurato non esiste più.',
          ephemeral: true
        });
      }

      // Check if user already has the role
      if (interaction.member.roles.cache.has(v.roleId)) {
        return await interaction.reply({
          content: '✅ Sei già verificato!',
          ephemeral: true
        });
      }

      // Check bot permissions
      const botMember = interaction.guild.members.me;
      if (!botMember.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
        return await interaction.reply({
          content: '❌ Il bot non ha il permesso di gestire i ruoli.',
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

  async execute(interaction) { if (typeof this.showPanel==='function') return this.showPanel(interaction); if (typeof this.handleVerification==='function') return this.handleVerification(interaction); return interaction.reply({content: '❌ Dashboard modulo non implementata correttamente!', ephemeral: true}); },

  // Esporta le funzioni di utilità per uso esterno
  initializeGuildConfigs,
  ensureGuildConfig
};
