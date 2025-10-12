const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ChannelType, ComponentType, PermissionFlagsBits } = require('discord.js');

// Utility: chunk array for pagination
const chunk = (arr, size) => {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
};

function buildCategoryMenu(current) {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('category')
      .setPlaceholder('Scegli una categoria…')
      .addOptions(
        { label: '📊 Panoramica', value: 'overview', default: current === 'overview' },
        { label: '👋 Benvenuto', value: 'welcome', default: current === 'welcome' },
        { label: '👋 Addii', value: 'goodbye', default: current === 'goodbye' },
        { label: '🎵 Musica', value: 'music', default: current === 'music' },
        { label: '🛡️ Moderazione', value: 'moderation', default: current === 'moderation' },
        { label: '🏆 Gamification', value: 'gamification', default: current === 'gamification' },
        { label: '🎁 Giveaway', value: 'giveaway', default: current === 'giveaway' },
        { label: '✅ Verifica', value: 'verify', default: current === 'verify' },
      )
  );
}

function buildNavButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('prev').setEmoji('◀️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('next').setEmoji('▶️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('save').setEmoji('💾').setLabel('Salva').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('close').setEmoji('⏹️').setLabel('Chiudi').setStyle(ButtonStyle.Danger)
  );
}

function renderOverview(state) {
  return new EmbedBuilder()
    .setColor('#2b2d31')
    .setTitle('Dashboard Bot — Panoramica')
    .setDescription('Configura il bot tramite la UI paginata. Nessuna modifica permanente finché non salvi.')
    .addFields(
      { name: 'Welcome', value: state.config.welcome.enabled ? `Attivo → <#${state.config.welcome.channel || 'n/d'}>` : 'Disattivo', inline: true },
      { name: 'Goodbye', value: state.config.goodbye.enabled ? `Attivo → <#${state.config.goodbye.channel || 'n/d'}>` : 'Disattivo', inline: true },
      { name: 'Musica', value: state.config.music.enabled ? 'Attiva' : 'Disattiva', inline: true },
      { name: 'Moderazione', value: state.config.moderation.automod ? 'AutoMod: ON' : 'AutoMod: OFF', inline: true },
      { name: 'Gamification', value: state.config.gamification.xp ? `XP: ON ×${state.config.gamification.multiplier}` : 'XP: OFF', inline: true },
      { name: 'Giveaway', value: `DM Winner: ${state.config.giveaway.dmWinners ? 'ON' : 'OFF'}`, inline: true },
      { name: 'Verifica', value: state.config.verify.enabled ? `Mode: ${state.config.verify.mode}` : 'Disattivata', inline: true },
    );
}

function renderCategory(state) {
  const { category, config } = state;
  const e = new EmbedBuilder().setColor('#5865F2');
  switch (category) {
    case 'welcome':
      e.setTitle('👋 Benvenuto').setDescription('Configura messaggi di benvenuto')
        .addFields(
          { name: 'Stato', value: config.welcome.enabled ? 'Attivo' : 'Disattivo', inline: true },
          { name: 'Canale', value: config.welcome.channel ? `<#${config.welcome.channel}>` : '—', inline: true },
          { name: 'Messaggio', value: `"${config.welcome.message}"` },
        );
      break;
    case 'goodbye':
      e.setTitle('👋 Addii').setDescription('Configura messaggi di addio')
        .addFields(
          { name: 'Stato', value: config.goodbye.enabled ? 'Attivo' : 'Disattivo', inline: true },
          { name: 'Canale', value: config.goodbye.channel ? `<#${config.goodbye.channel}>` : '—', inline: true },
          { name: 'Messaggio', value: `"${config.goodbye.message}"` },
        );
      break;
    case 'music':
      e.setTitle('🎵 Musica')
        .addFields(
          { name: 'Stato', value: config.music.enabled ? 'Attiva' : 'Disattiva', inline: true },
          { name: 'AutoPlay', value: config.music.autoplay ? 'ON' : 'OFF', inline: true },
          { name: 'DJ Role', value: config.music.djRole ? `<@&${config.music.djRole}>` : '—', inline: true },
        );
      break;
    case 'moderation':
      e.setTitle('🛡️ Moderazione')
        .addFields(
          { name: 'AutoMod', value: config.moderation.automod ? 'ON' : 'OFF', inline: true },
          { name: 'Log Channel', value: config.moderation.logs ? `<#${config.moderation.logs}>` : '—', inline: true },
        );
      break;
    case 'gamification':
      e.setTitle('🏆 Gamification')
        .addFields(
          { name: 'XP', value: config.gamification.xp ? 'ON' : 'OFF', inline: true },
          { name: 'Moltiplicatore', value: String(config.gamification.multiplier), inline: true },
          { name: 'Premi', value: Object.keys(config.gamification.rewardsRoleMap).length ? Object.entries(config.gamification.rewardsRoleMap).map(([lvl, role]) => `Lvl ${lvl} → <@&${role}>`).join('\n') : 'Nessuno' },
        );
      break;
    case 'giveaway':
      e.setTitle('🎁 Giveaway')
        .addFields(
          { name: 'Host Role', value: config.giveaway.hostRole ? `<@&${config.giveaway.hostRole}>` : '—', inline: true },
          { name: 'Log Channel', value: config.giveaway.logs ? `<#${config.giveaway.logs}>` : '—', inline: true },
          { name: 'DM Winners', value: config.giveaway.dmWinners ? 'ON' : 'OFF', inline: true },
        );
      break;
    case 'verify':
      e.setTitle('✅ Verifica')
        .addFields(
          { name: 'Stato', value: config.verify.enabled ? 'Attiva' : 'Disattivata', inline: true },
          { name: 'Ruolo', value: config.verify.role ? `<@&${config.verify.role}>` : '—', inline: true },
          { name: 'Canale', value: config.verify.channel ? `<#${config.verify.channel}>` : '—', inline: true },
          { name: 'Modalità', value: config.verify.mode, inline: true },
        );
      break;
    default:
      return renderOverview(state);
  }
  return e;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setbot')
    .setDescription('🏛️ Dashboard — Configura il bot con interfaccia paginata')
    ,
  async execute(interaction) {
    try {
      if (!interaction.inGuild?.()) {
        return interaction.reply({ content: '🏠 Usa questo comando in un server.', ephemeral: true });
      }
      if (!interaction.member?.permissions?.has(PermissionFlagsBits.Administrator)) {
        return interaction.reply({ content: '🚫 Accesso negato: servono permessi Amministratore.', ephemeral: true });
      }

      const state = {
        category: 'overview',
        pageIndex: 0,
        pages: [],
        config: {
          welcome: { enabled: false, channel: null, image: null, message: 'Benvenuto {user} in {server}!' },
          goodbye: { enabled: false, channel: null, image: null, message: 'Addio {user}.' },
          music: { enabled: true, djRole: null, autoplay: false },
          moderation: { automod: true, logs: null },
          gamification: { xp: true, multiplier: 1, rewardsRoleMap: {} },
          giveaway: { hostRole: null, logs: null, dmWinners: true },
          verify: { enabled: false, role: null, channel: null, mode: 'button' },
        },
      };

      const buildPages = () => {
        const catOrder = ['overview', 'welcome', 'goodbye', 'music', 'moderation', 'gamification', 'giveaway', 'verify'];
        state.pages = catOrder.map(cat => renderCategory({ ...state, category: cat }));
      };

      buildPages();

      await interaction.reply({
        embeds: [state.pages[state.pageIndex]],
        components: [buildCategoryMenu(state.category), buildNavButtons()],
      });

      const msg = await interaction.fetchReply();

      const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 5 * 60_000 });
      const selectCollector = msg.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 5 * 60_000 });

      collector.on('collect', async (i) => {
        try {
          if (i.user.id !== interaction.user.id) return i.reply({ content: 'Questa UI non è per te.', ephemeral: true });
          if (i.customId === 'prev') state.pageIndex = Math.max(0, state.pageIndex - 1);
          if (i.customId === 'next') state.pageIndex = Math.min(state.pages.length - 1, state.pageIndex + 1);
          if (i.customId === 'save') {
            // Placeholder: qui si salverebbe su DB
            await i.reply({ content: '✅ Config salvata (demo).', ephemeral: true });
            return;
          }
          if (i.customId === 'close') return collector.stop('user');

          await i.update({ embeds: [state.pages[state.pageIndex]], components: [buildCategoryMenu(state.category), buildNavButtons()] });
        } catch (err) {
          console.error('setbot button error:', err);
        }
      });

      selectCollector.on('collect', async (i) => {
        try {
          if (i.user.id !== interaction.user.id) return i.reply({ content: 'Questa UI non è per te.', ephemeral: true });
          const val = i.values?.[0];
          if (!val) return i.deferUpdate();
          state.category = val;
          buildPages();
          await i.update({ embeds: [state.pages[state.pageIndex]], components: [buildCategoryMenu(state.category), buildNavButtons()] });
        } catch (err) {
          console.error('setbot select error:', err);
        }
      });

      const endAll = async () => {
        try { await msg.edit({ components: [] }); } catch {}
      };
      collector.on('end', endAll);
      selectCollector.on('end', endAll);
    } catch (error) {
      console.error('Errore setbot:', error);
      if (interaction.replied || interaction.deferred) {
        try { await interaction.followUp({ content: '❌ Errore durante l\'apertura della dashboard.', ephemeral: true }); } catch {}
      } else {
        try { await interaction.reply({ content: '❌ Errore durante l\'apertura della dashboard.', ephemeral: true }); } catch {}
      }
    }
  },
};
