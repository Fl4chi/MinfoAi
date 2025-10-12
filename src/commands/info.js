const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, bold, inlineCode } = require('discord.js');
const User = require('../database/models/User');

// Utility: chunk array for pagination
const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

// Utility: safe string format
const fmt = (val, fallback = '—') => (val === null || val === undefined || val === '' ? fallback : String(val));

// Utility: Top words from messages stats map {word: count}
const topWords = (wordMap, n = 10) => {
  if (!wordMap || typeof wordMap !== 'object') return [];
  return Object.entries(wordMap)
    .filter(([w, c]) => w && typeof c === 'number')
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([w, c]) => `${inlineCode(w)} (${c})`);
};

// Build a single embed page
function buildInfoEmbeds({ interaction, targetUser, member, userData }) {
  const created = Math.floor(targetUser.createdTimestamp / 1000);
  const joined = member ? Math.floor(member.joinedTimestamp / 1000) : null;

  const stats = {
    level: userData?.level ?? 1,
    xp: userData?.xp ?? 0,
    messages: userData?.messageCount ?? 0,
    warnings: userData?.warnings ?? 0,
    lastLogin: userData?.lastLogin ? Math.floor(new Date(userData.lastLogin).getTime() / 1000) : null,
    preferences: {
      theme: userData?.preferences?.theme ?? 'default',
      notifications: userData?.preferences?.notifications ? 'Attive' : 'Disattivate',
      language: userData?.preferences?.language ?? 'IT',
    },
    interests: Array.isArray(userData?.interests) ? userData.interests : [],
    achievements: Array.isArray(userData?.achievements) ? userData.achievements : [],
    perChannel: userData?.perChannel || {}, // {channelId: count}
    hourly: userData?.hourly || {},         // {"0".."23": count}
    words: userData?.words || {},           // {word: count}
  };

  // Roles list (hide @everyone)
  const roles = member
    ? member.roles.cache
        .filter(r => r.id !== interaction.guild.id)
        .sort((a, b) => b.position - a.position)
        .map(r => r.toString())
    : [];

  // Per-channel stats formatting
  const channelStats = Object.entries(stats.perChannel)
    .sort((a, b) => b[1] - a[1])
    .map(([chId, cnt]) => `<#${chId}> • ${cnt}`);

  // Hourly stats formatting
  const hourlyStats = Array.from({ length: 24 }, (_, h) => {
    const c = stats.hourly?.[h] ?? 0;
    return `${String(h).padStart(2, '0')}: ${c}`;
  });

  // Build pages
  const pages = [];

  // Page 1: Overview
  const overview = new EmbedBuilder()
    .setColor(member?.displayHexColor || '#2b2d31')
    .setAuthor({ name: `${targetUser.tag}`, iconURL: targetUser.displayAvatarURL({ dynamic: true }) })
    .setTitle('Informazioni utente')
    .addFields(
      { name: 'ID', value: inlineCode(targetUser.id), inline: true },
      { name: 'Account creato', value: `<t:${created}:R>`, inline: true },
      { name: 'Entrato nel server', value: joined ? `<t:${joined}:R>` : '—', inline: true },
      { name: 'Livello', value: String(stats.level), inline: true },
      { name: 'XP', value: String(stats.xp), inline: true },
      { name: 'Messaggi', value: String(stats.messages), inline: true },
      { name: 'Avvisi', value: String(stats.warnings), inline: true },
      { name: 'Ultimo accesso', value: stats.lastLogin ? `<t:${stats.lastLogin}:R>` : '—', inline: true },
    )
    .setThumbnail(targetUser.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: `Richiesto da ${interaction.user.username}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
    .setTimestamp();

  pages.push(overview);

  // Page 2: Preferenze e Interessi
  const pref = new EmbedBuilder()
    .setColor('#5865F2')
    .setTitle('Preferenze e Interessi')
    .addFields(
      { name: 'Preferenze', value: [`Tema: ${fmt(stats.preferences.theme)}`, `Notifiche: ${stats.preferences.notifications}`, `Lingua: ${fmt(stats.preferences.language)}`].join('\n'), inline: false },
      { name: 'Interessi', value: stats.interests.length ? stats.interests.map(i => `• ${i}`).join('\n') : 'Nessun interesse registrato', inline: false },
    )
    .setTimestamp();
  pages.push(pref);

  // Page 3: Ruoli (se presenti)
  if (roles.length) {
    const roleChunks = chunk(roles, 20); // 20 per pagina
    roleChunks.forEach((slice, idx) => {
      pages.push(
        new EmbedBuilder()
          .setColor('#43B581')
          .setTitle(`Ruoli (${roles.length}) — Pag ${idx + 1}/${roleChunks.length}`)
          .setDescription(slice.join(', '))
      );
    });
  }

  // Page 4: Statistiche per canale (se presenti)
  if (channelStats.length) {
    const chChunks = chunk(channelStats, 10);
    chChunks.forEach((slice, idx) => {
      pages.push(
        new EmbedBuilder()
          .setColor('#FEE75C')
          .setTitle(`Statistiche per canale — Pag ${idx + 1}/${chChunks.length}`)
          .setDescription(slice.join('\n'))
      );
    });
  }

  // Page 5: Attività per orario
  if (hourlyStats.some(s => /\d+/.test(s))) {
    const hrChunks = chunk(hourlyStats, 12);
    hrChunks.forEach((slice, idx) => {
      pages.push(
        new EmbedBuilder()
          .setColor('#EB459E')
          .setTitle(`Attività oraria — Pag ${idx + 1}/${hrChunks.length}`)
          .setDescription(slice.join('\n'))
      );
    });
  }

  // Page 6: Parole più usate
  const wordsTop = topWords(stats.words, 20);
  if (wordsTop.length) {
    const wChunks = chunk(wordsTop, 10);
    wChunks.forEach((slice, idx) => {
      pages.push(
        new EmbedBuilder()
          .setColor('#57F287')
          .setTitle(`Parole più usate — Pag ${idx + 1}/${wChunks.length}`)
          .setDescription(slice.join(' \u2022 '))
      );
    });
  }

  return pages;
}

function buildPaginator(current, total) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('prev').setEmoji('◀️').setStyle(ButtonStyle.Secondary).setDisabled(total <= 1 || current === 0),
    new ButtonBuilder().setCustomId('next').setEmoji('▶️').setStyle(ButtonStyle.Secondary).setDisabled(total <= 1 || current >= total - 1),
    new ButtonBuilder().setCustomId('stop').setEmoji('⏹️').setStyle(ButtonStyle.Danger)
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('info')
    .setDescription('Mostra informazioni complete e paginate su un utente')
    .addUserOption(opt => opt.setName('utente').setDescription("L'utente di cui visualizzare le informazioni").setRequired(false)),

  async execute(interaction) {
    // Validation and permission checks
    if (!interaction.guild) {
      return interaction.reply({ content: 'Questo comando può essere usato solo in un server.', ephemeral: true });
    }

    // Defer for performance if DB is involved
    try { await interaction.deferReply({ ephemeral: false }); } catch {}

    try {
      const targetUser = interaction.options.getUser('utente') || interaction.user;
      const member = interaction.guild?.members.cache.get(targetUser.id) || null;

      // Permission-based info visibility (only moderators can see warnings count)
      const isMod = interaction.member.permissions.has(PermissionFlagsBits.ManageGuild);

      let userData = await User.findOne({ userId: targetUser.id, guildId: interaction.guild.id }).lean();
      if (!userData) {
        userData = await User.create({
          userId: targetUser.id,
          guildId: interaction.guild.id,
          xp: 0,
          level: 1,
          messageCount: 0,
          lastLogin: new Date(),
          preferences: { language: 'IT', notifications: true, theme: 'default' },
          interests: [],
          warnings: 0,
          achievements: [],
        });
        userData = userData.toObject?.() || userData;
      }

      // Hide sensitive fields if not mod
      if (!isMod) userData.warnings = undefined;

      const pages = buildInfoEmbeds({ interaction, targetUser, member, userData });

      let index = 0;
      const msg = await interaction.editReply({ embeds: [pages[index]], components: [buildPaginator(index, pages.length)] });

      const collector = msg.createMessageComponentCollector({
        filter: (i) => ['prev', 'next', 'stop'].includes(i.customId) && i.user.id === interaction.user.id,
        time: 60_000,
      });

      collector.on('collect', async (i) => {
        try {
          if (i.customId === 'prev') index = Math.max(0, index - 1);
          if (i.customId === 'next') index = Math.min(pages.length - 1, index + 1);
          if (i.customId === 'stop') return collector.stop('user');
          await i.update({ embeds: [pages[index]], components: [buildPaginator(index, pages.length)] });
        } catch (err) {
          console.error('Paginator update error:', err);
        }
      });

      collector.on('end', async () => {
        try { await msg.edit({ components: [] }); } catch {}
      });
    } catch (error) {
      console.error('Errore nel comando info:', error);
      const errorMsg = '❌ Si è verificato un errore durante il recupero delle informazioni.';
      try {
        if (interaction.deferred || interaction.replied) await interaction.editReply({ content: errorMsg, embeds: [], components: [] });
        else await interaction.reply({ content: errorMsg, ephemeral: true });
      } catch {}
    }
  },
};
