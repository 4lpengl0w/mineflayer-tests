const { goals: { GoalBlock } } = require('mineflayer-pathfinder');

module.exports = {
  name: 'suicide',
  async execute(bot, message, args) {
    try {
      if (!global.runLoops) global.runLoops = new Map();
      const target = { x: -708, y: 29, z: -782 };
      const goal = new GoalBlock(target.x, target.y, target.z);
      const shouldLoop = args[0]?.toLowerCase() === 'loop';

      // If user typed !run loop, toggle looping mode
      if (shouldLoop) {
        const active = global.runLoops.get(bot.username);
        if (active) {
          global.runLoops.set(bot.username, false);
          bot.pathfinder.setGoal(null);
          await message.reply(`⏹️ Run loop stopped for **${bot.username}**.`);
          return;
        } else {
          global.runLoops.set(bot.username, true);
          await message.reply(`🏃 Run loop started for **${bot.username}**.`);
        }
      }

      // Function to go once
      async function goOnce() {
        return new Promise((resolve) => {
          bot.pathfinder.setMovements(bot.defaultMove);
          bot.pathfinder.setGoal(goal);
          const onReached = () => {
            bot.removeListener('goal_reached', onReached);
            resolve(true);
          };
          bot.once('goal_reached', onReached);
        });
      }

      // Run once or loop
      if (shouldLoop) {
        while (global.runLoops.get(bot.username)) {
          try {
            await goOnce();
            await new Promise((r) => setTimeout(r, 1000)); // short pause
          } catch (err) {
            console.warn(`[Run] Error during loop: ${err.message}`);
          }
        }
      } else {
        await message.reply(`🏃 Moving **${bot.username}** to (-708, 29, -782)...`);
        await goOnce();
        await message.reply(`✅ **${bot.username}** reached destination.`);
      }
    } catch (err) {
      console.error('[Run] Error:', err);
      await message.reply('⚠️ Error executing run command.');
    }
  },
};
