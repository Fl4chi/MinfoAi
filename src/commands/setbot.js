const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ComponentType } = require('discord.js');
const db = require('../database/db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setbot')
    .setDescription('Configura il bot')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  async execute(interaction) {
    const state = {
      category: 'overview',
      pageIndex: 0,
      pages: [],
      config: await db.getGuildConfig(interaction.guild.id) || {}
    };

    const renderCategory = ({ category, config }) => {
      const embed = new EmbedBuilder().setColor(0x00AE86).setTitle(`⚙️ Configurazione: ${category}`);
      switch (category) {
        case 'overview':
          embed.setDescription('Panoramica delle impostazioni del bot.');
          break;
        case 'welcome':
          embed.addFields(
            { name: '🎉 Canale Benvenuto', value: config.welcomeChannel ? `<#${config.welcomeChannel}>` : 'Non impostato', inline: true },
            { name: '📝 Messaggio', value: config.welcomeMessage || 'Benvenuto {user}!', inline: false }
          );
          break;
        case 'goodbye':
          embed.addFields(
            { name: '👋 Canale Addio', value: config.goodbyeChannel ? `<#${config.goodbyeChannel}>` : 'Non impostato', inline: true },
            { name: '📝 Messaggio', value: config.goodbyeMessage || 'Addio {user}!', inline: false }
          );
          break;
        case 'music':
          embed.addFields(
            { name: '🎵 Canale Musica', value: config.musicChannel ? `<#${config.musicChannel}>` : 'Non impostato', inline: true },
            { name: '🔊 Volume Default', value: `${config.defaultVolume || 50}%`, inline: true }
          );
          break;
        case 'moderation':
          embed.addFields(
            { name: '🛡️ Canale Log', value: config.modLogChannel ? `<#${config.modLogChannel}>` : 'Non impostato', inline: true },
            { name: '⚠️ Auto-Moderazione', value: config.autoMod ? 'ON' : 'OFF', inline: true }
          );
          break;
        case 'gamification':
          embed.addFields(
            { name: '🎮 Sistema Livelli', value: config.levelingEnabled ? 'ON' : 'OFF', inline: true },
            { name: '🏆 Ruolo Livello', value: config.levelRoles ? 'Configurato' : 'Non impostato', inline: true }
          );
          break;
        case 'giveaway':
          embed.addFields(
            { name: '🎁 Canale Giveaway', value: config.giveawayChannel ? `<#${config.giveawayChannel}>` : 'Non impostato', inline: true },
            { name: '🎉 Ruolo Notifiche', value: config.giveawayRole ? `<@&${config.giveawayRole}>` : 'Non impostato', inline: true }
          );
          break;
        case 'verify':
          embed.addFields(
            { name: '✅ Sistema Verifica', value: config.verifyEnabled ? 'ON' : 'OFF', inline: true },
            { name: '👤 Ruolo Verificato', value: config.verifyRole ? `<@&${config.verifyRole}>` : 'Non impostato', inline: true },
            { name: '🔧 Modalità', value: config.verifyMode || 'button', inline: true }
          );
          break;
      }
      return embed;
    };

    const buildCategoryMenu = (current) => {
      return new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('category')
          .setPlaceholder('Seleziona una categoria')
          .addOptions([
            { label: '📊 Panoramica', value: 'overview', default: current === 'overview' },
            { label: '🎉 Benvenuto', value: 'welcome', default: current === 'welcome' },
            { label: '👋 Addio', value: 'goodbye', default: current === 'goodbye' },
            { label: '🎵 Musica', value: 'music', default: current === 'music' },
            { label: '🛡️ Moderazione', value: 'moderation', default: current === 'moderation' },
            { label: '🎮 Gamification', value: 'gamification', default: current === 'gamification' },
            { label: '🎁 Giveaway', value: 'giveaway', default: current === 'giveaway' },
            { label: '✅ Verifica', value: 'verify', default: current === 'verify' }
          ])
      );
    };

    const buildNavButtons = () => {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('prev').setLabel('◀').setStyle(ButtonStyle.Primary).setDisabled(state.pageIndex === 0),
        new ButtonBuilder().setCustomId('next').setLabel('▶').setStyle(ButtonStyle.Primary).setDisabled(state.pageIndex === state.pages.length - 1)
      );
    };

    const buildConfigRows = () => {
      const rows = [];
      switch (state.category) {
        case 'welcome':
          rows.push(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder().setCustomId('welcome_channel').setPlaceholder('Seleziona canale benvenuto')
              .addOptions(interaction.guild.channels.cache.filter(c => c.isTextBased()).map(c => ({ label: `#${c.name}`, value: c.id })).slice(0, 25))
          ));
          break;
        case 'goodbye':
          rows.push(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder().setCustomId('goodbye_channel').setPlaceholder('Seleziona canale addio')
              .addOptions(interaction.guild.channels.cache.filter(c => c.isTextBased()).map(c => ({ label: `#${c.name}`, value: c.id })).slice(0, 25))
          ));
          break;
        case 'music':
          rows.push(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder().setCustomId('music_channel').setPlaceholder('Seleziona canale musica')
              .addOptions(interaction.guild.channels.cache.filter(c => c.isTextBased()).map(c => ({ label: `#${c.name}`, value: c.id })).slice(0, 25))
          ));
          break;
        case 'moderation':
          rows.push(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder().setCustomId('mod_log_channel').setPlaceholder('Canale log moderazione')
              .addOptions(interaction.guild.channels.cache.filter(c => c.isTextBased()).map(c => ({ label: `#${c.name}`, value: c.id })).slice(0, 25))
          ));
          rows.push(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder().setCustomId('auto_mod').setPlaceholder('Auto-Moderazione: ON/OFF').addOptions([
              { label: 'ON', value: 'on' },
              { label: 'OFF', value: 'off' }
            ])
          ));
          break;
        case 'gamification':
          rows.push(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder().setCustomId('leveling').setPlaceholder('Sistema Livelli: ON/OFF').addOptions([
              { label: 'ON', value: 'on' },
              { label: 'OFF', value: 'off' }
            ])
          ));
          break;
        case 'giveaway':
          rows.push(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder().setCustomId('giveaway_channel').setPlaceholder('Canale giveaway')
              .addOptions(interaction.guild.channels.cache.filter(c => c.isTextBased()).map(c => ({ label: `#${c.name}`, value: c.id })).slice(0, 25))
          ));
          break;
        case 'verify':
          rows.push(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder().setCustomId('verify').setPlaceholder('Verifica: ON/OFF').addOptions([
              { label: 'ON', value: 'on' },
              { label: 'OFF', value: 'off' }
            ])
          ));
          rows.push(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder().setCustomId('verify_role').setPlaceholder('Ruolo verificato')
              .addOptions(
                ...interaction.guild.roles.cache.filter(r => r.editable && r.name !== '@everyone').map(r => ({ label: `@${r.name}`, value: r.id }))
              )
          ));
          rows.push(new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder().setCustomId('verify_mode').setPlaceholder('Modalità verifica')
              .addOptions([
                { label: 'Bottone', value: 'button' },
                { label: 'Reazione', value: 'reaction' }
              ])
          ));
          break;
      }
      return rows;
    };

    const buildPages = () => {
      const catOrder = ['overview', 'welcome', 'goodbye', 'music', 'moderation', 'gamification', 'giveaway', 'verify'];
      state.pageIndex = Math.max(0, Math.min(state.pageIndex, catOrder.length - 1));
      state.pages = catOrder.map(cat => renderCategory({ ...state, category: cat }));
    };

    buildPages();

    await interaction.reply({
      embeds: [state.pages[state.pageIndex]],
      components: [buildCategoryMenu(state.category), buildNavButtons()],
      ephemeral: true,
    });

    const msg = await interaction.fetchReply();
    const buttonCollector = msg.createMessageComponentCollector({ componentType: ComponentType.Button, time: 5 * 60_000 });
    const selectCollector = msg.createMessageComponentCollector({ componentType: ComponentType.StringSelect, time: 5 * 60_000 });

    const ensureAuthor = (i) => i.user.id === interaction.user.id;

    buttonCollector.on('collect', async (i) => {
      if (!ensureAuthor(i)) return i.reply({ content: 'Non puoi usare questi pulsanti!', ephemeral: true });
      if (i.customId === 'prev') state.pageIndex--;
      if (i.customId === 'next') state.pageIndex++;
      buildPages();
      await i.update({ embeds: [state.pages[state.pageIndex]], components: [buildCategoryMenu(state.category), buildNavButtons()] });
    });

    selectCollector.on('collect', async (i) => {
      if (!ensureAuthor(i)) return i.reply({ content: 'Non puoi usare questi menu!', ephemeral: true });
      if (i.customId === 'category') {
        state.category = i.values[0];
        state.pageIndex = ['overview', 'welcome', 'goodbye', 'music', 'moderation', 'gamification', 'giveaway', 'verify'].indexOf(state.category);
        buildPages();
        await i.update({ embeds: [state.pages[state.pageIndex]], components: [buildCategoryMenu(state.category), buildNavButtons()] });
      } else {
        const key = i.customId;
        const val = i.values[0];
        state.config[key] = val;
        await db.updateGuildConfig(interaction.guild.id, { [key]: val });
        buildPages();
        await i.update({ embeds: [state.pages[state.pageIndex]], components: [buildCategoryMenu(state.category), buildNavButtons()] });
      }
    });

    buttonCollector.on('end', async () => {
      await interaction.editReply({ components: [] }).catch(() => {});
    });
  }
};
