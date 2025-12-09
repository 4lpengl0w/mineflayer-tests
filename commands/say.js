module.exports = {
  name: 'say',
  async execute(bot, message, args) {
    const text = args.join(' ');
    if (!text) return message.reply('❌ Nothing to say.');
    bot.chat(text);
  }
};
