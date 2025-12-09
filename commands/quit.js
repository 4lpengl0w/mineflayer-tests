module.exports = {
  name: 'quit',
  async execute(bot, message, args) {
    bot.end();
  }
};