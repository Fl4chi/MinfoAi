const db = require('../../database/db');
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder } = require('discord.js');

// Funzione per generare l'embed welcome nei dati aggiornati
function buildWelcomeEmbed(config) {
  return new EmbedBuilder()
    .setTitle('⚙️ Configurazione: welcome')
    .setColor(config.welcomeEnabled ? '#43B581' : '#ED4245')
    .addFields(
      { name: 'Canale Benvenuto', value: config.welcomeChannelId ? `<#${config.welcomeChannelId}>` : 'Non impostato', inline: false },
      { name: 'Messaggio', value: config.welcomeMessage || '{user}', inline: false },
      { name: 'Sistema', value: config.welcomeEnabled ? '🟢 ON' : '🔴 OFF', inline: false }
    );
}

// Genera i select e bottoni della dashboard welcome (aggiungi canali discord dinamicamente)
function buildWelcomeComponents(config, allChannels) {
  return [
    new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('welcome_channel_select')
        .setPlaceholder('Seleziona canale benvenuto')
        .addOptions([{ label: 'Nessuno', value: 'none' }, ...(allChannels || [])])
    ),
    new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('welcome_toggle')
        .setLabel(config.welcomeEnabled ? 'Disattiva' : 'Attiva')
        .setStyle(config.welcomeEnabled ? 4 : 3)
    )
    // espandi ulteriori funzionalità qui
  ];
}

// Handler centrale collector/interaction per dashboard welcome
async function handleWelcomeInteraction(interaction, allChannels) {
  // Carica sempre la config aggiornata dopo ogni salvataggio!
  const config = await db.getGuildConfig(interaction.guildId);

  if (interaction.isStringSelectMenu() && interaction.customId === 'welcome_channel_select') {
    const newVal = interaction.values[0] === 'none' ? null : interaction.values[0];
    await db.updateGuildConfig(interaction.guildId, { welcomeChannelId: newVal });
  }
  if (interaction.isButton() && interaction.customId === 'welcome_toggle') {
    await db.updateGuildConfig(interaction.guildId, { welcomeEnabled: !config.welcomeEnabled });
  }

  // Dopo ogni salvataggio rileggi la config aggiornata e aggiorna la UI
  const refreshedConfig = await db.getGuildConfig(interaction.guildId);

  // Re-render della dashboard: la preview e i componenti vengono aggiornati subito
  await interaction.update({
    embeds: [buildWelcomeEmbed(refreshedConfig)],
    components: buildWelcomeComponents(refreshedConfig, allChannels),
    ephemeral: true
  });
}

module.exports = { buildWelcomeEmbed, buildWelcomeComponents, handleWelcomeInteraction };
