const fs = require('fs');
const path = require('path');
const config = require('./config/config');
const { Client, GatewayIntentBits } = require('discord.js');
const { commands, loadCommands, reloadCommands } = require('./core/commandLoader');
const { makeBot, botMap } = require('./core/botManager');
const { readFile, sleep } = require('./core/utils');

global.makeBot = makeBot;
global.botMap = botMap;
global.ALL_COMMAND_DELAY_MS = config.ALL_COMMAND_DELAY_MS;
global.reloadCommands = reloadCommands;
global.proxies = [];

if (typeof global.nextViewerPort === 'undefined') {
  global.nextViewerPort = config.VIEWER_START_PORT || 3000;
}

const DISCORD_TOKEN = config.DISCORD_TOKEN;
const DISCORD_CATEGORY_ID = config.DISCORD_CATEGORY_ID;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
global.discordClient = client;

async function getBotChannel(username) {
  const guild = client.guilds.cache.first();
  if (!guild) return null;
  const channelName = username.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  let channel = guild.channels.cache.find(c => c.parentId === DISCORD_CATEGORY_ID && c.name === channelName && c.type === 0);
  if (channel) return channel;
  try {
    channel = await guild.channels.create({
      name: channelName,
      type: 0,
      parent: DISCORD_CATEGORY_ID
    });
    return channel;
  } catch (e) {
    console.error('Failed to create channel', e.message);
    return null;
  }
}

global.getBotChannel = getBotChannel;

client.on('clientReady', async () => {
  console.log('[DISCORD] Ready', client.user && client.user.tag);
  client.guilds.cache.forEach(g => g.channels.cache.size === 0 && g.channels.fetch());
  //await cleanupUnusedChannels(client);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (message.channel.parentId !== DISCORD_CATEGORY_ID) return;

  // find bot entry for this channel
  const botEntry = Array.from(botMap.values()).find(entry => entry.channel && entry.channel.id === message.channel.id);
  if (!botEntry) return;

  const content = message.content.trim();

  if (content.startsWith('/')) bot.chat(content);

  if (!content.startsWith('!')) return;

  const parts = content.slice(1).split(/\s+/);
  const rawCmd = parts.shift().toLowerCase();
  const args = parts;

  // handle "<cmd>all" pattern
  if (rawCmd.endsWith('all')) {
    const baseCmd = rawCmd.slice(0, -3);
    const cmdModule = commands.get(baseCmd);
    if (!cmdModule) return message.reply('Unknown command: ' + baseCmd);

    const usernames = Array.from(botMap.keys());
    for (const name of usernames) {
      const entry = botMap.get(name);
      if (!entry || !entry.bot) continue;
      try {
        cmdModule.execute(entry.bot, message, args);
      } catch (e) {
        console.error('Error executing command for', name, e);
      }
      await sleep(global.ALL_COMMAND_DELAY_MS || 1000);
    }
    return;
  }

  // normal single-bot command
  const cmdModule = commands.get(rawCmd);
  if (!cmdModule) {
    return message.reply('Unknown command: ' + rawCmd);
  }
  try {
    await cmdModule.execute(botEntry.bot, message, args);
  } catch (e) {
    console.error('Command execution error', e);
    message.reply('Command failed: ' + e.message);
  }
});

(async () => {
  loadCommands();

  if (DISCORD_TOKEN === 'YOUR_DISCORD_BOT_TOKEN_HERE') {
    console.error('Please set your DISCORD_TOKEN in config/config.js or as env var.');
    return;
  }

  await client.login(DISCORD_TOKEN);

  if (fs.existsSync('proxies.txt')) {
    const proxiesFile = await readFile('proxies.txt');
    global.proxies = proxiesFile.split(/\r?\n/).map(p => p.trim()).filter(p => p);
  }

  if (fs.existsSync('accounts.txt')) {
    const accountsFile = await readFile('accounts.txt');
    const accounts = accountsFile.split(/\r?\n/).map(a => a.trim()).filter(a => a);
    for (let i = 0; i < accounts.length; i++) {
      const username = accounts[i];
      const proxy = global.proxies.length > 0
        ? global.proxies[i % global.proxies.length]
        : null;

      await makeBot(username, proxy);
      const delay = Math.floor(Math.random() * (config.MAX_DELAY_MS - config.MIN_DELAY_MS + 1)) + config.MIN_DELAY_MS;
      console.log(`[WAIT] Delaying next bot creation for ${delay}ms...`);
      await sleep(delay);
    }
  } else {
    console.log('No accounts.txt found. Add accounts.txt to auto-start bots.');
  }
})();

process.on('uncaughtException', err => {
  console.error('[FATAL] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[FATAL] Unhandled Rejection:', reason);
});