module.exports = {
  name: 'online',
  async execute(bot, message, args) {
    const onlinePlayers = bot.players;
    const playerCount = Object.keys(onlinePlayers).length;
    let ds_message = `online (${playerCount}): `;
    for (const username in onlinePlayers) {
      if (onlinePlayers.hasOwnProperty(username)) {
        const playerObject = onlinePlayers[username];
        ds_message += `\n${playerObject.displayName.toString()}`;
      }
    }
    message.channel.send(ds_message);
  }
};