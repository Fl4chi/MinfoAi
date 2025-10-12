true } ) ;
    }
    verification.timeoutSec = n;
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
