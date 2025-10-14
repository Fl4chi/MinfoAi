// welcome.js — Dashboard Welcome (2025-10-14)
// Requisiti: Dashboard principale solo menu a tendina; Category Welcome con 4 bottoni:
// 1) On/Off  2) Ripristina  3) Messaggio (submenu per Titolo/Messaggio/Immagine/Footer)  4) Anteprima
// Ogni azione aggiorna istantaneamente embed e variabili. Interfaccia ottimizzata, handler minimali.

const db = require('../../database/db');
const {
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
} = require('discord.js');

// ===== Helpers =====
function safeStr(v, def = '') {
  return typeof v === 'string' ? v : (v ?? def);
}

function getDefaultConfig(guildId) {
  return {
    guildId,
    welcomeEnabled: true,
    welcomeChannelId: null,
    welcomeMessage: '{user}',
    welcomeEmbed: {
      enabled: true,
      title: 'Benvenuto!',
      description: 'Ciao {user}, benvenuto su {server}! 🎉',
      color: '#5865F2',
      image: '',
      footer: 'Arrivato oggi',
    },
  };
}

function ensureConfig(interaction) {
  const guildId = interaction?.guildId;
  if (!guildId) return getDefaultConfig(null);
  const cfg = db.getGuildConfig(guildId) || {};
  return {
    guildId,
    welcomeEnabled: cfg.welcomeEnabled ?? true,
    welcomeChannelId: cfg.welcomeChannelId || null,
    welcomeMessage: safeStr(cfg.welcomeMessage, '{user}'),
    welcomeEmbed: {
      enabled: cfg.welcomeEmbed?.enabled ?? true,
      title: safeStr(cfg.welcomeEmbed?.title, 'Benvenuto!'),
      description: safeStr(cfg.welcomeEmbed?.description, 'Ciao {user}, benvenuto su {server}! 🎉'),
      color: safeStr(cfg.welcomeEmbed?.color, '#5865F2'),
      image: safeStr(cfg.welcomeEmbed?.image, ''),
      footer: safeStr(cfg.welcomeEmbed?.footer, 'Arrivato oggi'),
    },
  };
}

function getTextChannels(interaction) {
  try {
    const cache = interaction?.guild?.channels?.cache;
    if (!cache) return [{ label: 'Nessun canale disponibile', value: 'none', default: true }];
    const opts = cache
      .filter(c => c?.type === ChannelType.GuildText)
      .map(c => ({ label: `#${c.name}`, value: c.id }))
      .slice(0, 25);
    return opts.length ? opts : [{ label: 'Nessun canale disponibile', value: 'none', default: true }];
  } catch (e) {
    console.error('[welcome] getTextChannels error:', e);
    return [{ label: 'Errore canali', value: 'error', default: true }];
  }
}

// ===== UI Builders =====
function buildEmbed(cfg) {
  const embed = new EmbedBuilder()
    .setTitle(cfg.welcomeEmbed.title)
    .setDescription(cfg.welcomeEmbed.description)
    .setColor(cfg.welcomeEmbed.color)
    .setFooter({ text: cfg.welcomeEmbed.footer });
  if (cfg.welcomeEmbed.image) embed.setImage(cfg.welcomeEmbed.image);
  return embed;
}

function buildDashboard(interaction) {
  const cfg = ensureConfig(interaction);

  // Menu a tendina principale (selezione canale)
  const channels = getTextChannels(interaction);
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId('welcome_channel_select')
    .setPlaceholder(
      cfg.welcomeChannelId
        ? `Canale: #${interaction.guild?.channels?.cache?.get(cfg.welcomeChannelId)?.name || 'sconosciuto'}`
        : 'Seleziona canale di benvenuto'
    )
    .addOptions(channels);

  // Category Welcome: 4 bottoni sotto il menu canale
  const btnOnOff = new ButtonBuilder()
    .setCustomId('welcome_toggle')
    .setLabel(cfg.welcomeEnabled ? 'On' : 'Off')
    .setStyle(cfg.welcomeEnabled ? ButtonStyle.Success : ButtonStyle.Secondary);

  const btnReset = new ButtonBuilder()
    .setCustomId('welcome_reset')
    .setLabel('Ripristina')
    .setStyle(ButtonStyle.Danger);

  const btnMessage = new ButtonBuilder()
    .setCustomId('welcome_message_menu')
    .setLabel('Messaggio')
    .setStyle(ButtonStyle.Primary);

  const btnPreview = new ButtonBuilder()
    .setCustomId('welcome_preview')
    .setLabel('Anteprima')
    .setStyle(ButtonStyle.Secondary);

  const rowChannel = new ActionRowBuilder().addComponents(selectMenu);
  const rowButtons = new ActionRowBuilder().addComponents(btnOnOff, btnReset, btnMessage, btnPreview);

  const statusLines = [
    `Stato: ${cfg.welcomeEnabled ? '✅ Attivo' : '❌ Disattivo'}`,
    `Canale: ${cfg.welcomeChannelId ? `<#${cfg.welcomeChannelId}>` : '❌ Non impostato'}`,
    `Messaggio: ${cfg.welcomeMessage}`,
    `Colore: ${cfg.welcomeEmbed.color}`,
    `Immagine: ${cfg.welcomeEmbed.image ? '✅' : '❌'}`,
    `Footer: ${cfg.welcomeEmbed.footer}`,
  ];

  const embed = buildEmbed(cfg).addFields({ name: 'Configurazione Corrente', value: statusLines.join('\n'), inline: false });

  return { embeds: [embed], components: [rowChannel, rowButtons] };
}

function buildMessageMenu(cfg) {
  // Sottomenu Messaggio: un unico select per scegliere quale campo editare
  const options = [
    { label: 'Titolo', value: 'title' },
    { label: 'Messaggio', value: 'description' },
    { label: 'Immagine', value: 'image' },
    { label: 'Footer', value: 'footer' },
    { label: 'Colore', value: 'color' },
  ];
  const select = new StringSelectMenuBuilder()
    .setCustomId('welcome_message_field')
    .setPlaceholder('Scegli elemento da modificare')
    .addOptions(options);
  return { components: [new ActionRowBuilder().addComponents(select)], embeds: [buildEmbed(cfg)] };
}

// ===== Update helpers =====
async function refresh(interaction) {
  const data = buildDashboard(interaction);
  if (interaction.deferred || interaction.replied) return interaction.editReply(data);
  return interaction.update(data);
}

async function refreshWith(interaction, builder) {
  const cfg = ensureConfig(interaction);
  const data = builder(cfg);
  if (interaction.deferred || interaction.replied) return interaction.editReply(data);
  return interaction.update(data);
}

// ===== Handlers =====
async function handleChannelSelect(interaction) {
  const choice = interaction.values?.[0];
  if (!choice || choice === 'none' || choice === 'error') {
    return interaction.reply({ content: 'Selezione canale non valida.', ephemeral: true });
  }
  const cfg = ensureConfig(interaction);
  cfg.welcomeChannelId = choice;
  db.setGuildConfig(cfg.guildId, cfg);
  return refresh(interaction);
}

async function handleToggle(interaction) {
  const cfg = ensureConfig(interaction);
  cfg.welcomeEnabled = !cfg.welcomeEnabled;
  db.setGuildConfig(cfg.guildId, cfg);
  return refresh(interaction);
}

async function handleReset(interaction) {
  const def = getDefaultConfig(interaction.guildId);
  db.setGuildConfig(def.guildId, def);
  return refresh(interaction);
}

async function handleMessageMenu(interaction) {
  const cfg = ensureConfig(interaction);
  return refreshWith(interaction, () => buildMessageMenu(cfg));
}

async function handleMessageField(interaction) {
  const field = interaction.values?.[0];
  if (!field) return interaction.reply({ content: 'Selezione non valida.', ephemeral: true });

  // Trasformiamo la selezione in un inline prompt via select menu a cascata
  // Per semplificare: mostriamo menu di valori predefiniti e un'opzione "custom" che apre un modal è vietato; quindi usiamo select precompilate.
  const presets = {
    title: [
      { label: 'Benvenuto!', value: 'Benvenuto!' },
      { label: 'Ciao {user} 👋', value: 'Ciao {user} 👋' },
      { label: 'custom...', value: '__custom_title__' },
    ],
    description: [
      { label: 'Standard', value: 'Ciao {user}, benvenuto su {server}! 🎉' },
      { label: 'Minimal', value: 'Benvenuto {user}.' },
      { label: 'custom...', value: '__custom_description__' },
    ],
    image: [
      { label: 'Nessuna', value: '' },
      { label: 'Esempio immagine', value: 'https://i.imgur.com/Welcome.png' },
      { label: 'custom...', value: '__custom_image__' },
    ],
    footer: [
      { label: 'Arrivato oggi', value: 'Arrivato oggi' },
      { label: 'Benvenuto in famiglia', value: 'Benvenuto in famiglia' },
      { label: 'custom...', value: '__custom_footer__' },
    ],
    color: [
      { label: 'Blu Discord', value: '#5865F2' },
      { label: 'Verde', value: '#57F287' },
      { label: 'Rosso', value: '#ED4245' },
      { label: 'custom...', value: '__custom_color__' },
    ],
  };

  const options = presets[field] || [];
  const select = new StringSelectMenuBuilder()
    .setCustomId(`welcome_message_value:${field}`)
    .setPlaceholder('Scegli un valore o custom...')
    .addOptions(options.map(o => ({ label: o.label, value: o.value })));

  return refreshWith(interaction, (cfg) => ({
    embeds: [buildEmbed(cfg)],
    components: [new ActionRowBuilder().addComponents(select)],
  }));
}

async function handleMessageValue(interaction) {
  const [prefix, field] = safeStr(interaction.customId, '').split(':');
  if (prefix !== 'welcome_message_value' || !field) {
    return interaction.reply({ content: 'Interazione non valida.', ephemeral: true });
  }
  const value = interaction.values?.[0];
  const cfg = ensureConfig(interaction);

  // Gestione valore custom tramite menu dedicato senza modal: presentiamo una piccola lista di placeholder come fallback
  if (value?.startsWith('__custom_')) {
    const placeholders = new StringSelectMenuBuilder()
      .setCustomId(`welcome_message_custom:${field}`)
      .setPlaceholder('Seleziona placeholder comune o mantieni attuale')
      .addOptions([
        { label: '{user}', value: '{user}' },
        { label: '{server}', value: '{server}' },
        { label: 'Mantieni attuale', value: '__keep__' },
      ]);
    return refreshWith(interaction, () => ({
      embeds: [buildEmbed(cfg)],
      components: [new ActionRowBuilder().addComponents(placeholders)],
    }));
  }

  applyField(cfg, field, value);
  db.setGuildConfig(cfg.guildId, cfg);
  return refresh(interaction);
}

async function handleMessageCustom(interaction) {
  const [prefix, field] = safeStr(interaction.customId, '').split(':');
  if (prefix !== 'welcome_message_custom' || !field) {
    return interaction.reply({ content: 'Interazione non valida.', ephemeral: true });
  }
  const choice = interaction.values?.[0];
  const cfg = ensureConfig(interaction);
  if (choice && choice !== '__keep__') {
    applyField(cfg, field, choice);
    db.setGuildConfig(cfg.guildId, cfg);
  }
  return refresh(interaction);
}

function applyField(cfg, field, value) {
  switch (field) {
    case 'title': cfg.welcomeEmbed.title = value; break;
    case 'description': cfg.welcomeEmbed.description = value; break;
    case 'image': cfg.welcomeEmbed.image = value; break;
    case 'footer': cfg.welcomeEmbed.footer = value; break;
    case 'color': cfg.welcomeEmbed.color = value; break;
    default: break;
  }
}

async function handlePreview(interaction) {
  const cfg = ensureConfig(interaction);
  const embed = buildEmbed(cfg);
  const content = cfg.welcomeChannelId ? `Anteprima in <#${cfg.welcomeChannelId}>` : 'Anteprima';
  return interaction.reply({ content, embeds: [embed], ephemeral: true });
}

// ===== Exports / Router =====
module.exports = {
  async execute(interaction) {
    try {
      if (!interaction.deferred && !interaction.replied) {
        await interaction.deferReply({ ephemeral: true });
      }
      await interaction.editReply(buildDashboard(interaction));
    } catch (e) {
      console.error('[welcome] execute error:', e);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({ content: 'Errore nell\'apertura della dashboard.', components: [], embeds: [] });
      } else {
        await interaction.reply({ content: 'Errore.', ephemeral: true });
      }
    }
  },

  async onComponent(interaction) {
    try {
      const id = interaction.customId || '';
      if (id === 'welcome_channel_select') return handleChannelSelect(interaction);
      if (id === 'welcome_toggle') return handleToggle(interaction);
      if (id === 'welcome_reset') return handleReset(interaction);
      if (id === 'welcome_message_menu') return handleMessageMenu(interaction);
      if (id.startsWith('welcome_message_field')) return handleMessageField(interaction);
      if (id.startsWith('welcome_message_value:')) return handleMessageValue(interaction);
      if (id.startsWith('welcome_message_custom:')) return handleMessageCustom(interaction);
      if (id === 'welcome_preview') return handlePreview(interaction);

      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'Componente non riconosciuto.', ephemeral: true });
      }
    } catch (e) {
      console.error('[welcome] onComponent error:', e);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'Errore nell\'interazione.', ephemeral: true });
      }
    }
  },

  // Compat
  async handleWelcome(interaction) { return this.execute(interaction); },
  async showPanel(interaction) { return this.execute(interaction); },
};
