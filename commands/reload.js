module.exports = {
  name: 'reload',
  async execute(bot, message) {
    try {
      const { reloadCommands } = global;
      reloadCommands();
      await message.reply('✅ Commands reloaded successfully.');
    } catch (err) {
      console.error('Reload failed:', err);
      await message.reply('❌ Failed to reload commands.');
    }
  },
};