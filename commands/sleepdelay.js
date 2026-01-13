module.exports = {
  name: 'sleepdelay',
  description: 'Adjust the delay between bots when using "all" commands (in milliseconds).',
  execute: async (bot, message, args) => {
    if (args.length === 0) {
      return message.reply(`Current sleep delay is ${global.ALL_COMMAND_DELAY_MS}ms.`);
    }

    const newDelay = parseInt(args[0]);

    if (isNaN(newDelay) || newDelay < 0) {
      return message.reply('Please provide a valid number of milliseconds (e.g., !sleepdelay 2000).');
    }

    global.ALL_COMMAND_DELAY_MS = newDelay;
    message.reply(`✅ Success! The delay for "all" commands has been set to ${newDelay}ms.`);
  }
};