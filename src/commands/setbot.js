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
      verify: '✅ Verifica',
    };

    const buildOverview = () => {
      const lines = Object.entries(state.config)
        .map(([key, value]) => {
          const enabled = typeof value.enabled === 'boolean' ? (value.enabled ? 'On' : 'Off') : '—';
          return `• ${categoryLabels[key] || key}: ${enabled}`;
        })
        .join('\n');

      return new EmbedBuilder()
        .setColor([88,101,242])
        .setAuthor({ name: '🏛️ MinfoAi Dashboard', iconURL: interaction.client.user.displayAvatarURL({ size: 128 }) })
        .setDescription('Configura le funzioni con menu, anteprima e salvataggio fittizio (nessun DB).')
        .addFields({ name: 'Stato rapido', value: '```\n' + lines + '\n```' })
        .setFooter({ text: `Richiesto da ${interaction.user.username}` })
        .setTimestamp();
    };

    const buildCategoryEmbed = (key) => {
      const base = new EmbedBuilder().setColor([88,101,242]).setTitle(`${categoryLabels[key]} — Impostazioni`);
      const cfg = state.config[key];

      if (key === 'welcome' || key === 'goodbye') {
        base.addFields(
          { name: 'Stato', value: cfg.enabled ? 'Abilitato' : 'Disabilitato', inline: true },
          { name: 'Canale', value: cfg.channel ? `<#${cfg.channel}>` : 'Nessuno', inline: true },
          { name: 'Immagine', value: cfg.image ? cfg.image : 'Nessuna', inline: true },
          { name: 'Messaggio', value: '```' + (cfg.message || '-') + '```' }
        );
      }
      if (key === 'music') {
        base.addFields(
          { name: 'Stato', value: cfg.enabled ? 'Abilitato' : 'Disabilitato', inline: true },
          { name: 'DJ Role', value: cfg.djRole ? `<@&${cfg.djRole}>` : 'Nessuno', inline: true },
          { name: 'Autoplay', value: cfg.autoplay ? 'On' : 'Off', inline: true },
        );
      }
      if (key === 'moderation') {
        base.addFields(
          { name: 'AutoMod', value: cfg.automod ? 'On' : 'Off', inline: true },
          { name: 'Log Channel', value: cfg.logs ? `<#${cfg.logs}>` : 'Nessuno', inline: true },
        );
      }
      if (key === 'verify') {
        base.addFields(
          { name: 'Stato', value: cfg.enabled ? 'Abilitato' : 'Disabilitato', inline: true },
          { name: 'Ruolo', value: cfg.role ? `<@&${cfg.role}>` : 'Nessuno', inline: true },
          { name: 'Canale', value: cfg.channel ? `<#${cfg.channel}>` : 'Nessuno', inline: true },
          { name: 'Modalità', value: cfg.mode || 'button', inline: true },
        );
      }
      return base;
    };

    // Menu categoria principale
    const navRow = () => new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('db-category')
        .setPlaceholder('Seleziona categoria')
        .addOptions(
          ...Object.entries(categoryLabels).map(([value, label]) => (
            new StringSelectMenuOptionBuilder().setLabel(label).setValue(value)
          ))
        )
    );

    // UI dinamica: canali, ruoli, immagini (placeholder)
    const channelOptions = interaction.guild.channels.cache
      .filter(c => [ChannelType.GuildText, ChannelType.GuildAnnouncement].includes(c.type))
      .first(25)
      .map(c => ({ label: `#${c.name}`.slice(0, 100), value: c.id }));

    const roleOptions = interaction.guild.roles.cache
      .filter(r => r.editable && !r.managed)
      .sort((a,b) => b.position - a.position)
      .first(25)
      .map(r => ({ label: r.name.slice(0, 100), value: r.id }));

    const imagePresets = [
      { label: '🎉 Festoso', value: 'preset_party' },
      { label: '🌙 Notturno', value: 'preset_dark' },
      { label: '🌈 Colorato', value: 'preset_color' },
      { label: '🧊 Minimal', value: 'preset_minimal' },
    ];

    const buildControlsRow1 = () => new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('db-channel')
        .setPlaceholder('Seleziona canale')
        .addOptions(channelOptions),
      new StringSelectMenuBuilder()
        .setCustomId('db-role')
        .setPlaceholder('Seleziona ruolo')
        .addOptions(roleOptions)
    );

    const buildControlsRow2 = () => new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('db-image')
        .setPlaceholder('Seleziona immagine/preset')
        .addOptions(imagePresets),
    );

    const actionRow = () => new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('db-preview').setLabel('Anteprima').setStyle(ButtonStyle.Primary).setEmoji('🖼️'),
      new ButtonBuilder().setCustomId('db-reset').setLabel('Reset').setStyle(ButtonStyle.Danger).setEmoji('♻️'),
      new ButtonBuilder().setLabel('Wiki').setStyle(ButtonStyle.Link).setURL('https://github.com/Fl4chi/MinfoAi/wiki').setEmoji('📚'),
    );

    const currentEmbed = buildOverview();
    const msg = await interaction.reply({
      embeds: [currentEmbed],
      components: [navRow(), buildControlsRow1(), buildControlsRow2(), actionRow()],
      ephemeral: true,
    });

    const buttonCollector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 15 * 60_000 });
    const selectCollector = msg.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 15 * 60_000 });

    selectCollector.on('collect', async i => {
      if (i.user.id !== interaction.user.id) return i.reply({ content: '❌ Solo il richiedente può usare questa dashboard.', ephemeral: true });

      if (i.customId === 'db-category') {
        const value = i.values?.[0];
        state.category = value || 'overview';
        const embed = state.category === 'overview' ? buildOverview() : buildCategoryEmbed(state.category);
        return i.update({ embeds: [embed], components: [navRow(), buildControlsRow1(), buildControlsRow2(), actionRow()] });
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
      return i.update({ embeds: [embed], components: [navRow(), buildControlsRow1(), buildControlsRow2(), actionRow()] });
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
        return i.update({ embeds: [emb], components: [navRow(), buildControlsRow1(), buildControlsRow2(), actionRow()] });
      }
    });

    const endAll = async () => {
      try { await msg.edit({ components: [] }); } catch {}
    };

    buttonCollector.on('end', endAll);
    selectCollector.on('end', endAll);
  }
};
