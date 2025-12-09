module.exports = {
  name: 'claim',
  async execute(bot, message, args) {
    const claimAll = args[0]?.toLowerCase() === 'all';
    const stopMessage = 'Призы » Вы не наиграли';
    let stop = false;

    const chatListener = (jsonMsg) => {
      const text = jsonMsg.toString().trim();
      if (text.includes(stopMessage)) {
        stop = true;
      }
    };
    bot.on('message', chatListener);

    async function claimOnce() {
      return new Promise(async (resolve) => {
        const windowPromise = new Promise((res) => bot.once('windowOpen', res));
        bot.chat('/free');

        const window = await windowPromise;
        await new Promise((res) => setTimeout(res, 500));

        const containerItems = window.containerItems();
        for (const item of containerItems) {
          if (item.name === 'player_head') {
            try {
                await bot.clickWindow(item.slot, 0, 0);
            } catch (err) {
                console.log(err);
            }
            break;
          }
        }
        // Give it a moment for chat + GUI update
        await new Promise((res) => setTimeout(res, 1000));
        resolve();
      });
    }

    if (claimAll) {
      let attempts = 0;
      while (!stop && attempts < 18) {
        await claimOnce();
        attempts++;
      }
    } else {
      await claimOnce();
    }

    bot.removeListener('message', chatListener);
  },
};
