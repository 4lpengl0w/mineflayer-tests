const { goals: { GoalBlock } } = require('mineflayer-pathfinder');

module.exports = {
  name: 'donate',
  async execute(bot, message, args) {
    const targetPos = new GoalBlock(-739.5, 55, -732.5);
    const maxRetries = 5;
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));

    async function tryMove() {
      for (let i = 0; i < maxRetries; i++) {
        try {
          await bot.pathfinder.goto(targetPos);
          return true;
        } catch (err) {
          console.warn(`[Donate] Move attempt ${i + 1} failed: ${err.message}`);
          await wait(1000);
        }
      }
      console.warn('[Donate] Failed to reach target after retries.');
      return false;
    }

    async function findAnchor() {
      try {
        const anchorId = bot.registry.blocksByName.lime_shulker_block.id;
        const block = bot.findBlock({
          matching: anchorId,
          maxDistance: 2,
          count: 1,
        });
        return block;
      } catch (err) {
        console.warn('[Donate] Error finding anchor:', err.message);
        return null;
      }
    }

    try {
      await tryMove();

      const anchorBlock = await findAnchor();
      if (!anchorBlock) {
        await message.reply('❌ No respawn anchor found nearby.');
        return;
      }

      const windowPromise = new Promise(resolve => { bot.once('windowOpen', resolve); });

      try {
        await bot.activateBlock(anchorBlock);
        message.reply(`[ANCHOR] activated the anchor. Waiting for window...`);
      } catch (err) {
        message.reply(`[ANCHOR] failed to activate block: ${err.message}. Aborting.`);
        return;
      }

      let window;
      try {
        window = await windowPromise;
        message.reply(`[ANCHOR] anchor window opened.`);
        await wait(500);
      } catch (err) {
        message.reply(`[ANCHOR] timed out waiting for window to open. ${err}`);
        return;
      }

      try {
        const containerItems = window.containerItems();

        for (const item of containerItems) {
            if (!item) continue; 
            
            if (item.name === 'chest' || item.name === 'trapped_chest') {
                await bot.clickWindow(item.slot, 0, 0); 
                message.reply(`[ANCHOR] clicked slot ${item.slot} in the anchor. Task complete.`);
                break;
            }
        }
      } catch (err) {
        if (err.message && err.message.includes("Server didn't respond to transaction")) {

        } else {
            message.reply(`[ANCHOR ERROR] error during item click: ${err.message}.`);
        }
      }
    } catch (err) {
        console.log(err);
    }
  },
};
