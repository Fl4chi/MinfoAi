const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ChannelType, ComponentType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setbot')
    .setDescription('🏛️ Dashboard — Configura il bot con interfaccia moderna (solo UI, no DB)')
    ,
  async execute(interaction) {
    if (!interaction.inGuild?.()) {
      return interaction.reply({ content: '🏠 Usa questo comando in un server.', ephemeral: true });
    }
    if (!interaction.member?.permissions?.has('Administrator')) {
      return interaction.reply({ content: '🚫 Accesso negato: servono permessi Amministratore.', ephemeral: true });
    }
    // Stato temporaneo SOLO per la sessione corrente (placeholder, niente DB)
    const state = {
      category: 'overview',
      config: {
        welcome: { enabled: false, channel: null, image: null, message: 'Benvenuto {user} in {server}!' },
        goodbye: { enabled: false, channel: null, image: null, message: 'Addio {user}.' },
        music: { enabled: true, djRole: null, autoplay: false },
        moderation: { automod: true, logs: null },
        gamification: { xp: true, multiplier: 1, rewardsRoleMap: {} },
        giveaway: { hostRole: null, logs: null, dmWinners: true },
        verify: { enabled: false, role: null, channel: null, mode: 'button' },
      }
    };
    const categoryLabels = {
      overview: '📊 Panoramica',
      welcome: '👋 Benvenuto',
      goodbye: '👋 Addii',
      music: '🎵 Musica',
      moderation: '🛡️ Moderazione',
      gamification: '🏆 Gamification',
      giveaway: '🎁 Giveaway',
      verify: '✅ Verifica'
    };
    // Helper functions per costruire gli embed
    const buildOverview = () => {
      return new EmbedBuilder()
        .setTitle('🏛️ Dashboard Bot — Panoramica Generale')
        .setDescription(`**Stato attuale delle configurazioni del bot:**\n\n${Object.keys(categoryLabels).filter(k => k !== 'overview').map(k => {
          const cfg = state.config[k];
          if (!cfg) return `${categoryLabels[k]}: ❓ Non definito`;
          const enabled = cfg.enabled !== undefined ? (cfg.enabled ? '🟢' : '🔴') : '🟢';
          return `${categoryLabels[k]}: ${enabled}`;
        }).join('\n')}\n\n⚠️ **Nota:** Configurazioni temporanee (nessun database).`)
        .setColor(0x3498db)
        .setTimestamp();
    };
    const buildCategoryEmbed = (cat) => {
      const cfg = state.config[cat];
      if (!cfg) return buildOverview();
      return new EmbedBuilder()
        .setTitle(`${categoryLabels[cat]} — Configurazione`)
        .setDescription(JSON.stringify(cfg, null, 2).replace(/[{}"]/g, '').trim() || 'Nessuna configurazione')
        .setColor(0xe74c3c)
        .setTimestamp();
    };
    // Row navigation
    const navRow = () => new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('db-nav')
        .setPlaceholder('🧭 Naviga tra le sezioni')
        .addOptions(
          Object.keys(categoryLabels).map(key => 
            new StringSelectMenuOptionBuilder()
              .setLabel(categoryLabels[key])
              .setValue(key)
              .setDefault(state.category === key)
          )
        )
    );
    // FIXED: Split channel and role selectors into separate rows
    // Row for channel selection (1 select menu per row)
    const buildChannelRow = () => {
      const key = state.category;
      if (!['welcome', 'goodbye', 'moderation', 'verify', 'giveaway'].includes(key)) {
        return null; // No channel selector for this category
      }
      const channels = interaction.guild.channels.cache
        .filter(ch => ch.type === ChannelType.GuildText)
        .first(25); // Discord limit
      if (channels.length === 0) return null;
      return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('db-channel')
          .setPlaceholder('📋 Seleziona canale')
          .addOptions(
            channels.map(ch => 
              new StringSelectMenuOptionBuilder()
                .setLabel(`# ${ch.name}`)
                .setValue(ch.id)
            )
          )
      );
    };
    // Row for role selection (1 select menu per row)
    const buildRoleRow = () => {
      const key = state.category;
      if (!['music', 'giveaway', 'verify'].includes(key)) {
        return null; // No role selector for this category
      }
      const roles = interaction.guild.roles.cache
        .filter(r => r.name !== '@everyone')
        .first(25); // Discord limit
      if (roles.length === 0) return null;
      return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('db-role')
          .setPlaceholder('🎭 Seleziona ruolo')
          .addOptions(
            roles.map(role => 
              new StringSelectMenuOptionBuilder()
                .setLabel(`@${role.name}`)
                .setValue(role.id)
            )
          )
      );
    };
    // Row for image selection (1 select menu per row)
    const buildImageRow = () => {
      if (!['welcome', 'goodbye'].includes(state.category)) {
        return null;
      }
      return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('db-image')
          .setPlaceholder('🖼️ Seleziona immagine')
          .addOptions([
            new StringSelectMenuOptionBuilder().setLabel('🌅 Tramonto').setValue('sunset'),
            new StringSelectMenuOptionBuilder().setLabel('🌊 Oceano').setValue('ocean'),
            new StringSelectMenuOptionBuilder().setLabel('🏔️ Montagne').setValue('mountains'),
            new StringSelectMenuOptionBuilder().setLabel('🌟 Stelle').setValue('stars'),
            new StringSelectMenuOptionBuilder().setLabel('❌ Nessuna').setValue('none')
          ])
      );
    };
    // Action buttons row (max 5 buttons per row)
    const actionRow = () => new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('db-preview').setLabel('👁️ Anteprima').setStyle(ButtonStyle.Secondary),
      new ButtonBuilder().setCustomId('db-reset').setLabel('🔄 Reset').setStyle(ButtonStyle.Danger)
    );
    // Build components array, filtering null rows
    const buildComponents = () => {
      const components = [
        navRow(),
        buildChannelRow(),
        buildRoleRow(), 
        buildImageRow(),
        actionRow()
      ].filter(row => row !== null);
      
      // Discord allows max 5 ActionRows per message
      return components.slice(0, 5);
    };
    // Send initial message
    const embed = buildOverview();
    const msg = await interaction.reply({ 
      embeds: [embed], 
      components: buildComponents(),
      fetchReply: true 
    });
    // Collectors
    const selectCollector = msg.createMessageComponentCollector({
      componentType: ComponentType.StringSelect,
      time: 300000
    });
    const buttonCollector = msg.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 300000
    });
    selectCollector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) return i.reply({ content: '❌ Solo il richiedente può usare questa dashboard.', ephemeral: true });
      if (i.customId === 'db-nav') {
        const value = i.values?.[0];
        state.category = value || 'overview';
        const embed = state.category === 'overview' ? buildOverview() : buildCategoryEmbed(state.category);
        return i.update({ embeds: [embed], components: buildComponents() });
      }
      // Gestione select di canali/ruoli/immagini in base alla categoria
      const val = i.values?.[0];
      const key = state.category;
      if (!state.config[key]) return i.deferUpdate();
      if (i.customId === 'db-channel') {
        if (key === 'welcome' || key === 'goodbye' || key === 'moderation' || key === 'verify' || key === 'giveaway') {
          if (key === 'moderation') state.config.moderation.logs = val; else state.config[key].channel = val;
        }
      }
      if (i.customId === 'db-role') {
        if (key === 'music') state.config.music.djRole = val;
        if (key === 'giveaway') state.config.giveaway.hostRole = val;
        if (key === 'verify') state.config.verify.role = val;
      }
      if (i.customId === 'db-image') {
        if (key === 'welcome' || key === 'goodbye') state.config[key].image = val; // solo placeholder
      }
      const embed = key === 'overview' ? buildOverview() : buildCategoryEmbed(key);
      return i.update({ embeds: [embed], components: buildComponents() });
    });
    buttonCollector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) return i.reply({ content: '❌ Solo il richiedente può usare questa dashboard.', ephemeral: true });
      if (i.customId === 'db-preview') {
        const emb = state.category === 'overview' ? buildOverview() : buildCategoryEmbed(state.category);
        return i.reply({ content: 'Anteprima aggiornata.', embeds: [emb], ephemeral: true });
      }
      if (i.customId === 'db-reset') {
        const key = state.category;
        switch (key) {
          case 'welcome': state.config.welcome = { enabled: false, channel: null, image: null, message: 'Benvenuto {user} in {server}!' }; break;
          case 'goodbye': state.config.goodbye = { enabled: false, channel: null, image: null, message: 'Addio {user}.' }; break;
          case 'music': state.config.music = { enabled: true, djRole: null, autoplay: false }; break;
          case 'moderation': state.config.moderation = { automod: true, logs: null }; break;
          case 'gamification': state.config.gamification = { xp: true, multiplier: 1, rewardsRoleMap: {} }; break;
          case 'giveaway': state.config.giveaway = { hostRole: null, logs: null, dmWinners: true }; break;
          case 'verify': state.config.verify = { enabled: false, role: null, channel: null, mode: 'button' }; break;
          default: break;
        }
        const emb = key === 'overview' ? buildOverview() : buildCategoryEmbed(key);
        return i.update({ embeds: [emb], components: buildComponents() });
      }
    });
    const endAll = async () => {
      try { await msg.edit({ components: [] }); } catch {}
    };
    buttonCollector.on('end', endAll);
    selectCollector.on('end', endAll);
  }
};
