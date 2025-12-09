module.exports = {
  MINECRAFT_HOST: '',
  MINECRAFT_PORT: 25565,
  MIN_DELAY_MS: 3000,
  MAX_DELAY_MS: 3000,

  // Recommended: set DISCORD_TOKEN as an environment variable.
  DISCORD_TOKEN: process.env.DISCORD_TOKEN || '',

  // Discord category id where per-bot channels are created.
  DISCORD_CATEGORY_ID: process.env.DISCORD_CATEGORY_ID || '',
  DISCORD_CHAT_ID: '',

  // Delay between each bot when executing "<cmd>all"
  ALL_COMMAND_DELAY_MS: 1000,

  // Viewer starting port (each new bot will increment from this).
  VIEWER_START_PORT: 4000
};
