// src/commands/moderate.js
// Moderation commands: ban, kick, mute, warn, purge, log (custom)
// Requires Discord.js v14+ (adjust import if using CommonJS/ESM accordingly)

const { PermissionsBitField } = require('discord.js');

module.exports = {
  name: 'moderate',
  description: 'Moderation toolkit: ban | kick | mute | warn | purge | log',
  usage: '/moderate <subcommand> ...',
  options: [
    { name: 'ban', type: 'SUB_COMMAND', description: 'Ban a user', options: [ { name: 'user', type: 'USER', required: true }, { name: 'reason', type: 'STRING', required: false } ] },
    { name: 'kick', type: 'SUB_COMMAND', description: 'Kick a user', options: [ { name: 'user', type: 'USER', required: true }, { name: 'reason', type: 'STRING', required: false } ] },
    { name: 'mute', type: 'SUB_COMMAND', description: 'Mute a user', options: [ { name: 'user', type: 'USER', required: true }, { name: 'duration', type: 'STRING', required: false }, { name: 'reason', type: 'STRING', required: false } ] },
    { name: 'warn', type: 'SUB_COMMAND', description: 'Warn a user', options: [ { name: 'user', type: 'USER', required: true }, { name: 'reason', type: 'STRING', required: false } ] },
    { name: 'purge', type: 'SUB_COMMAND', description: 'Bulk delete messages', options: [ { name: 'amount', type: 'INTEGER', required: true } ] },
    { name: 'log', type: 'SUB_COMMAND', description: 'Send a custom log', options: [ { name: 'message', type: 'STRING', required: true } ] }
  ],

  // This handler assumes you route slash commands here
  async execute(interaction, { logHandler }) {
    if (!interaction.isChatInputCommand?.() && interaction.commandName !== 'moderate') return;

    const sub = interaction.options.getSubcommand();
    const member = interaction.member;

    // Permission checks
    if (!member.permissions.has(PermissionsBitField.Flags.ModerateMembers) && !member.permissions.has(PermissionsBitField.Flags.KickMembers) && !member.permissions.has(PermissionsBitField.Flags.BanMembers) && sub !== 'log') {
      return interaction.reply({ content: 'You do not have permission.', ephemeral: true });
    }

    const executorTag = `${interaction.user.tag}`;
    const guildId = interaction.guild?.id;

    try {
      switch (sub) {
        case 'ban': {
          const user = interaction.options.getUser('user', true);
          const reason = interaction.options.getString('reason') || 'No reason provided';
          const memberTarget = await interaction.guild.members.fetch(user.id).catch(() => null);
          if (!memberTarget) return interaction.reply({ content: 'User not found in guild.', ephemeral: true });
          await memberTarget.ban({ reason });
          await logHandler.log('ban', { guildId, executorTag, executorId: interaction.user.id, targetTag: user.tag, targetId: user.id, reason });
          return interaction.reply({ content: `Banned ${user.tag}.`, ephemeral: true });
        }
        case 'kick': {
          const user = interaction.options.getUser('user', true);
          const reason = interaction.options.getString('reason') || 'No reason provided';
          const memberTarget = await interaction.guild.members.fetch(user.id).catch(() => null);
          if (!memberTarget) return interaction.reply({ content: 'User not found in guild.', ephemeral: true });
          await memberTarget.kick(reason);
          await logHandler.log('kick', { guildId, executorTag, executorId: interaction.user.id, targetTag: user.tag, targetId: user.id, reason });
          return interaction.reply({ content: `Kicked ${user.tag}.`, ephemeral: true });
        }
        case 'mute': {
          const user = interaction.options.getUser('user', true);
          const duration = interaction.options.getString('duration') || null; // e.g., 10m, 1h
          const reason = interaction.options.getString('reason') || 'No reason provided';
          const ms = duration ? require('ms')(duration) : null;
          const memberTarget = await interaction.guild.members.fetch(user.id).catch(() => null);
          if (!memberTarget) return interaction.reply({ content: 'User not found in guild.', ephemeral: true });
          await memberTarget.timeout(ms || 5 * 60 * 1000, reason);
          await logHandler.log('mute', { guildId, executorTag, executorId: interaction.user.id, targetTag: user.tag, targetId: user.id, duration: duration || '5m', reason });
          return interaction.reply({ content: `Muted ${user.tag}.`, ephemeral: true });
        }
        case 'warn': {
          const user = interaction.options.getUser('user', true);
          const reason = interaction.options.getString('reason') || 'No reason provided';
          // Optional: persist warn to DB
          await logHandler.log('warn', { guildId, executorTag, executorId: interaction.user.id, targetTag: user.tag, targetId: user.id, reason });
          return interaction.reply({ content: `Warned ${user.tag}.`, ephemeral: true });
        }
        case 'purge': {
          const amount = interaction.options.getInteger('amount', true);
          if (amount < 1 || amount > 100) return interaction.reply({ content: 'Amount must be between 1 and 100.', ephemeral: true });
          const messages = await interaction.channel.bulkDelete(amount, true);
          await logHandler.log('purge', { guildId, executorTag, executorId: interaction.user.id, amount, channelId: interaction.channel.id, channelName: interaction.channel.name });
          return interaction.reply({ content: `Deleted ${messages.size} messages.`, ephemeral: true });
        }
        case 'log': {
          const message = interaction.options.getString('message', true);
          await logHandler.log('custom', { guildId, executorTag, executorId: interaction.user.id, message });
          return interaction.reply({ content: 'Custom log sent.', ephemeral: true });
        }
      }
    } catch (e) {
      await logHandler.log('error', { guildId, executorTag, executorId: interaction.user.id, message: e.message });
      return interaction.reply({ content: `Error: ${e.message}`, ephemeral: true });
    }
  }
};
