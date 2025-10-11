const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ComponentType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setbot')
    .setDescription('🏛️ Dashboard Premium — Configura il bot con interfaccia moderna'),

  async execute(interaction) {
    // Check: in guild only
    if (!interaction.inGuild?.()) {
      return interaction.reply({ content: '🏠 Usa questo comando in un server.', ephemeral: true });
    }

    // Check: admin only
    if (!interaction.member?.permissions?.has('Administrator')) {
      return interaction.reply({ content: '🚫 Accesso negato: servono permessi Amministratore.', ephemeral: true });
    }

    // Temporary state storage for the session
    const state = {
      category: 'overview',
      sub: null,
      config: {
        welcome: { enabled: false, channel: null, message: 'Benvenuto {user} in {server}!', preview: true },
        goodbye: { enabled: false, channel: null, message: 'Addio {user}.', preview: true },
        music: { enabled: true, djRole: null, autoplay: false },
        moderation: { automod: true, logs: null, warns: {}, tempPunish: true },
        gamification: { xp: true, multiplier: 1, rewardsRoleMap: {} },
        giveaway: { hostRole: null, logs: null, dmWinners: true },
        verify: { enabled: false, role: null, channel: null, mode: 'button' }
      }
    };

    // Helpers
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

    const buildOverview = () => {
      const lines = Object.entries(state.config).map(([key, value]) => {
        const enabled = typeof value.enabled === 'boolean' ? (value.enabled ? 'On' : 'Off') : '—';
        return `• ${categoryLabels[key] || key}: ${enabled}`;
      }).join('\n');
      return new EmbedBuilder()
        .setColor([88,101,242])
        .setAuthor({ name: '🏛️ MinfoAi Premium Dashboard', iconURL: interaction.client.user.displayAvatarURL({ size: 512 }) })
        .setDescription('Configura tutte le funzioni con menu a schede, anteprima e salvataggio istantaneo.')
        .addFields({ name: 'Stato rapido', value: '```\n' + lines + '\n```' })
        .setFooter({ text: `Richiesto da ${interaction.user.username}` })
        .setTimestamp();
    };

    const buildCategoryEmbed = (key) => {
      const base = new EmbedBuilder().setColor([88,101,242]).setTitle(`${categoryLabels[key]} — Impostazioni`);
      const cfg = state.config[key];
      switch (key) {
        case 'welcome':
        case 'goodbye': {
          base.setDescription('Personalizza canale, messaggio ed anteprima in tempo reale.\nPlaceholders: {user}, {server}, {memberCount}');
          base.addFields(
            { name: 'Stato', value: cfg.enabled ? 'Abilitato' : 'Disabilitato', inline: true },
            { name: 'Canale', value: cfg.channel ? `<#${cfg.channel}>` : 'Nessuno', inline: true },
            { name: 'Messaggio', value: '```' + cfg.message + '```' }
          );
          if (cfg.preview) {
            const previewText = cfg.message
              .replaceAll('{user}', interaction.user.toString())
              .replaceAll('{server}', interaction.guild.name)
              .replaceAll('{memberCount}', String(interaction.guild.memberCount ?? ''));
            base.addFields({ name: 'Anteprima', value: '```' + previewText + '```' });
          }
          break;
        }
        case 'music': {
          base.addFields(
            { name: 'Stato', value: cfg.autoplay ? 'Autoplay On' : 'Autoplay Off', inline: true },
            { name: 'DJ Role', value: cfg.djRole ? `<@&${cfg.djRole}>` : 'Nessun ruolo', inline: true }
          );
          break;
        }
        case 'moderation': {
          base.addFields(
            { name: 'AutoMod', value: cfg.automod ? 'On' : 'Off', inline: true },
            { name: 'Log', value: cfg.logs ? `<#${cfg.logs}>` : 'Nessun canale', inline: true },
            { name: 'TempPunizioni', value: cfg.tempPunish ? 'Abilitate' : 'Disabilitate', inline: true }
          );
          break;
        }
        case 'gamification': {
          base.addFields(
            { name: 'XP', value: cfg.xp ? 'Attivo' : 'Disattivo', inline: true },
            { name: 'Moltiplicatore', value: String(cfg.multiplier), inline: true },
            { name: 'Ricompense ruolo', value: Object.keys(cfg.rewardsRoleMap).length ? Object.entries(cfg.rewardsRoleMap).map(([lvl, role]) => `Lvl ${lvl} → <@&${role}>`).join('\n') : 'Nessuna' }
          );
          break;
        }
        case 'giveaway': {
          base.addFields(
            { name: 'Ruolo Host', value: cfg.hostRole ? `<@&${cfg.hostRole}>` : 'Nessun ruolo', inline: true },
            { name: 'Log', value: cfg.logs ? `<#${cfg.logs}>` : 'Nessun canale', inline: true },
            { name: 'DM Vincitori', value: cfg.dmWinners ? 'On' : 'Off', inline: true }
          );
          break;
        }
        case 'verify': {
          base.addFields(
            { name: 'Stato', value: cfg.enabled ? 'Abilitata' : 'Disabilitata', inline: true },
            { name: 'Ruolo', value: cfg.role ? `<@&${cfg.role}>` : 'Nessun ruolo', inline: true },
            { name: 'Canale', value: cfg.channel ? `<#${cfg.channel}>` : 'Nessun canale', inline: true },
            { name: 'Metodo', value: cfg.mode === 'button' ? 'Bottone' : 'Captcha', inline: true }
          );
          break;
        }
      }
      return base;
    };

    const mainSelect = new StringSelectMenuBuilder()
      .setCustomId('db-main')
      .setPlaceholder('Seleziona una categoria…')
      .addOptions(
        new StringSelectMenuOptionBuilder().setLabel(categoryLabels.overview).setValue('overview').setEmoji('📊'),
        new StringSelectMenuOptionBuilder().setLabel(categoryLabels.welcome).setValue('welcome').setEmoji('👋'),
        new StringSelectMenuOptionBuilder().setLabel(categoryLabels.goodbye).setValue('goodbye').setEmoji('👋'),
        new StringSelectMenuOptionBuilder().setLabel(categoryLabels.music).setValue('music').setEmoji('🎵'),
        new StringSelectMenuOptionBuilder().setLabel(categoryLabels.moderation).setValue('moderation').setEmoji('🛡️'),
        new StringSelectMenuOptionBuilder().setLabel(categoryLabels.gamification).setValue('gamification').setEmoji('🏆'),
        new StringSelectMenuOptionBuilder().setLabel(categoryLabels.giveaway).setValue('giveaway').setEmoji('🎁'),
        new StringSelectMenuOptionBuilder().setLabel(categoryLabels.verify).setValue('verify').setEmoji('✅')
      );

    const navRow = () => new ActionRowBuilder().addComponents(
      mainSelect
    );

    const actionRow = () => new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('db-back').setLabel('Indietro').setStyle(ButtonStyle.Secondary).setEmoji('⬅️'),
      new ButtonBuilder().setCustomId('db-save').setLabel('Salva').setStyle(ButtonStyle.Success).setEmoji('💾'),
      new ButtonBuilder().setCustomId('db-preview').setLabel('Anteprima').setStyle(ButtonStyle.Primary).setEmoji('🖼️'),
      new ButtonBuilder().setCustomId('db-reset').setLabel('Reset').setStyle(ButtonStyle.Danger).setEmoji('♻️'),
      new ButtonBuilder().setLabel('Wiki').setStyle(ButtonStyle.Link).setURL('https://github.com/Fl4chi/MinfoAi/wiki').setEmoji('📚')
    );

    const msg = await interaction.reply({
      embeds: [buildOverview()],
      components: [navRow(), actionRow()],
      ephemeral: true
    });

    const collector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 15 * 60_000 });
    const selectCollector = msg.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 15 * 60_000 });

    selectCollector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) return i.reply({ content: '❌ Solo il richiedente può usare questa dashboard.', ephemeral: true });
      const val = i.values?.[0];
      state.category = val;
      const embed = val === 'overview' ? buildOverview() : buildCategoryEmbed(val);
      await i.update({ embeds: [embed], components: [navRow(), actionRow()] });
    });

    collector.on('collect', async (i) => {
      if (i.user.id !== interaction.user.id) return i.reply({ content: '❌ Solo il richiedente può usare questa dashboard.', ephemeral: true });
      if (i.customId === 'db-back') {
        state.category = 'overview';
        return i.update({ embeds: [buildOverview()], components: [navRow(), actionRow()] });
      }
      if (i.customId === 'db-preview') {
        const emb = state.category === 'overview' ? buildOverview() : buildCategoryEmbed(state.category);
        return i.reply({ content: 'Anteprima aggiornata.', embeds: [emb], ephemeral: true });
      }
      if (i.customId === 'db-reset') {
        // soft reset of current category settings
        const key = state.category;
        if (state.config[key]) {
          switch (key) {
            case 'welcome': state.config[key] = { enabled: false, channel: null, message: 'Benvenuto {user} in {server}!', preview: true }; break;
            case 'goodbye': state.config[key] = { enabled: false, channel: null, message: 'Addio {user}.', preview: true }; break;
            case 'music': state.config[key] = { enabled: true, djRole: null, autoplay: false }; break;
            case 'moderation': state.config[key] = { automod: true, logs: null, warns: {}, tempPunish: true }; break;
            case 'gamification': state.config[key] = { xp: true, multiplier: 1, rewardsRoleMap: {} }; break;
            case 'giveaway': state.config[key] = { hostRole: null, logs: null, dmWinners: true }; break;
            case 'verify': state.config[key] = { enabled: false, role: null, channel: null, mode: 'button' }; break;
          }
        }
        const emb = state.category === 'overview' ? buildOverview() : buildCategoryEmbed(state.category);
        return i.update({ embeds: [emb], components: [navRow(), actionRow()] });
      }
      if (i.customId === 'db-save') {
        // Here you would persist to your database. This demo only confirms.
        return i.reply({ content: '✅ Impostazioni salvate (demo). Integrare persistenza nel database.', ephemeral: true });
      }
    });

    collector.on('end', async () => {
      try { await msg.edit({ components: [] }); } catch {}
    });
  }
};
