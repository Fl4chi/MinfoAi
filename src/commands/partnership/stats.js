const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Partnership = require('../../database/partnershipSchema');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('partnership')
    .setDescription('Gestisci il sistema partnership')
    .addSubcommand(subcommand =>
      subcommand
        .setName('stats')
        .setDescription('Visualizza le statistiche della tua partnership')
    ),

  async execute(interaction) {
    if (interaction.options.getSubcommand() !== 'stats') return;

    try {
      const partnership = await Partnership.findOne({ serverId: interaction.guildId });
      
      if (!partnership) {
        return interaction.reply({
          content: '❌ Il tuo server non ha una partnership attiva.',
          ephemeral: true
        });
      }

      // Calcola le statistiche
      const trustTrend = partnership.trustScore >= 70 ? '📈 In aumento' : partnership.trustScore >= 40 ? '⏱️ Stabile' : '📉 In calo';
      const nextTierCost = partnership.tier === 'Platinum' ? 'Massimo raggiunto' : getTierCost(partnership.tier);
      
      const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`📊 Partnership Stats - ${partnership.serverName}`)
        .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
        .addFields(
          { name: '\ud83c\udf86 Referral Completati', value: partnership.referralCount.toString(), inline: true },
          { name: '🤟 Partner Connessi', value: (partnership.referralCount * 3).toString(), inline: true },
          { name: '⚠️ Violazioni', value: partnership.violations.length.toString(), inline: true },
          { name: '💵 Guadagni Referral', value: `${partnership.referralCount * 500} coin`, inline: true },
          { name: '📈 Trend Trust Score', value: trustTrend, inline: true },
          { name: '🔓 Trust Score', value: `${partnership.trustScore}/100 ${getScoreBar(partnership.trustScore)}`, inline: true },
          { name: '\ud83d\udd17 Link Referral', value: `[Clicca qui](https://minfoai.bot/ref/${partnership.serverId})`, inline: false },
          { name: '\ud83d\ude80 Upgrade Successivo', value: nextTierCost, inline: true },
          { name: '\ud83c\udf1f Tempo Prossimo Bonus', value: getNextBonusTime(partnership.createdAt), inline: true }
        )
        .setFooter({ text: 'Partnership MinfoAi', iconURL: interaction.client.user.displayAvatarURL() })
        .setTimestamp();

      return interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error('Errore nel caricamento stats:', error);
      return interaction.reply({
        content: '❌ Errore nel caricamento statistiche.',
        ephemeral: true
      });
    }
  }
};

function getScoreBar(score) {
  const filled = Math.floor(score / 10);
  const empty = 10 - filled;
  return '■'.repeat(filled) + '□'.repeat(empty);
}

function getTierCost(tier) {
  const costs = { 'Bronze': '1000 coin', 'Silver': '5000 coin', 'Gold': '15000 coin' };
  return costs[tier] || '?';
}

function getNextBonusTime(createdAt) {
  const nextBonus = new Date(createdAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  return `<t:${Math.floor(nextBonus / 1000)}:R>`;
}
