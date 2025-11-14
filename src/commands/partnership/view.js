const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Partnership = require('../../database/partnershipSchema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('partnership')
    .setDescription('Gestisci il sistema partnership')
    .addSubcommand(subcommand =>
      subcommand
        .setName('view')
        .setDescription('Visualizza i dettagli della tua partnership')
    ),

  async execute(interaction) {
    if (interaction.options.getSubcommand() !== 'view') return;

    try {
      const partnership = await Partnership.findOne({ serverId: interaction.guildId });
      
      if (!partnership) {
        return interaction.reply({
          content: '❌ Il tuo server non ha una partnership attiva! Usa `/partnership request`.',
          ephemeral: true
        });
      }

      const tierEmojis = { 'Bronze': '🥉', 'Silver': '🦸', 'Gold': '🏫', 'Platinum': '💫' };

      const embed = new EmbedBuilder()
        .setColor(partnership.trustScore >= 80 ? '#00ff00' : partnership.trustScore >= 50 ? '#ffff00' : '#ff0000')
        .setTitle(`🤝 Partnership - ${partnership.serverName}`)
        .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
        .addFields(
          { name: 'Tier', value: `${tierEmojis[partnership.tier] || '?'} ${partnership.tier}`, inline: true },
          { name: 'Stato', value: partnership.status === 'active' ? '✅ Attiva' : '❌ Sospesa', inline: true },
          { name: 'Trust Score', value: `${partnership.trustScore}/100`, inline: true },
          { name: 'Categoria', value: partnership.category, inline: true },
          { name: 'Membri', value: partnership.memberCount.toString(), inline: true },
          { name: 'Referral Completati', value: partnership.referralCount.toString(), inline: true },
          { name: 'Descrizione', value: partnership.description || 'N/A', inline: false },
          { name: 'Vantaggi Tier', value: getTierBenefits(partnership.tier), inline: false }
        )
        .setFooter({ text: 'Partnership MinfoAi', iconURL: interaction.client.user.displayAvatarURL() })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error('Errore nel visualizzare partnership:', error);
      return interaction.reply({
        content: '❌ Errore nel caricamento dei dettagli.',
        ephemeral: true
      });
    }
  }
};

function getTierBenefits(tier) {
  const benefits = {
    'Bronze': '✅ Ban List Sharing
✅ Community Support',
    'Silver': '✅ Ban List Sharing
✅ Cross-Server Events
✅ Priority Support',
    'Gold': '✅ Ban List Sharing
✅ Cross-Server Events
✅ Dedicated Support
✅ Custom Branding',
    'Platinum': '✅ Ban List Sharing
✅ Cross-Server Events
✅ 24/7 Support
✅ Unlimited Members'
  };
  return benefits[tier] || 'Benefici non disponibili';
}
