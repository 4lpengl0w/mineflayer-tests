module.exports = {
  name: 'drop',
  async execute(bot, message, args) {
    const filter = args[0]?.toLowerCase();

    const items = bot.inventory.items();

    const filteredItems = filter
      ? items.filter(item =>
          item.name.toLowerCase().includes(filter.replace('minecraft:', ''))
        )
      : items;

    if (filteredItems.length === 0) {
      message.reply(
        filter
          ? `❌ No items found matching "${filter}".`
          : '❌ No items to drop.'
      );
      return;
    }

    let droppedCount = 0;
    for (const item of filteredItems) {
      try {
        await bot.tossStack(item);
        droppedCount++;
      } catch (err) {
        message.reply(`⚠️ Failed to drop ${item.name}: ${err.message}`);
        break;
      }
    }

    message.reply(
      filter
        ? `✅ Dropped ${droppedCount} item(s) of type "${filter}".`
        : `✅ Dropped all ${droppedCount} item(s).`
    );
  },
};
