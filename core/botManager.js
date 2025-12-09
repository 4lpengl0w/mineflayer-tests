const mineflayer = require('mineflayer');
const { pathfinder, Movements } = require('mineflayer-pathfinder');
const { GoalBlock } = require('mineflayer-pathfinder').goals;
const mineflayerViewer = require('prismarine-viewer').mineflayer;
const mcDataPackage = require('minecraft-data');
const { parseProxy, sleep, generateRandomHexColor } = require('./utils');
const config = require('../config/config');

const http = require('http');

const botMap = new Map();
let botCount = 0;

if (typeof global.nextViewerPort === 'undefined') {
  global.nextViewerPort = config.VIEWER_START_PORT || 3000;
}

const chatBuffers = new Map(); // { botName -> [lines] }
const BATCH_INTERVAL = 1000;
let batchTimer = null;

async function flushChatBuffers() {
  if (batchTimer) clearTimeout(batchTimer);
  batchTimer = setTimeout(async () => {
    const allEntries = Array.from(chatBuffers.entries()).filter(
      ([, msgs]) => msgs.length > 0
    );

    if (allEntries.length === 0) return;

    // Copy and clear buffers
    const buffersCopy = allEntries.map(([botName, msgs]) => ({
      botName,
      msgs: [...msgs],
    }));
    chatBuffers.forEach((_, k) => chatBuffers.set(k, []));

    // Check if all non-empty buffers have identical content AND more than one bot
    const firstMsg = buffersCopy[0].msgs.join('\n');
    const allSame =
      buffersCopy.length > 1 &&
      buffersCopy.every((b) => b.msgs.join('\n') === firstMsg);

    if (allSame) {
      // ✅ Shared message (2+ bots received same content)
      const client = global.discordClient;
      if (!client) {
        console.warn('[WARN] global.discordClient not set');
        return;
      }

      const chatChannel =
        client.channels.cache.get(config.DISCORD_CHAT_ID) ||
        (await client.channels.fetch(config.DISCORD_CHAT_ID).catch(() => null));

      if (chatChannel) {
        await chatChannel.send(firstMsg);
      } else {
        console.warn('⚠️ Shared chat channel not found');
      }
    } else {
      // ✅ Unique per bot messages
      for (const { botName, msgs } of buffersCopy) {
        if (!msgs.length) continue;
        const channel = await getBotChannel(botName);
        if (channel) {
          await channel.send(msgs.join('\n'));
        }
      }
    }
  }, BATCH_INTERVAL);
}

async function makeBot(username, proxyToUse = null, viewerPort = null) {
  const channel = await global.getBotChannel(username);
  if (!channel) {
    console.error(`[CRITICAL] Cannot start bot ${username}: Failed to get/create Discord channel.`);
    return;
  }

  let currentViewerPort;

  if (viewerPort) {
    currentViewerPort = viewerPort;
  } else {
    currentViewerPort = global.nextViewerPort++;
  }

  let proxyString = proxyToUse;

  if (!proxyString && global.proxies && global.proxies.length > 0) {
    const idx = botCount % global.proxies.length;
    proxyString = global.proxies[idx];
    botCount++;
  }

  const proxy = parseProxy(proxyString);

  channel.send(`[INIT] Bot **${username}** attempting connection using proxy: \`${proxyString}\``);

  const botOptions = {
    host: config.MINECRAFT_HOST,
    port: config.MINECRAFT_PORT,
    username,
    auth: 'offline',
    version: '1.16.5',
    connect: (client) => {
      if (!proxy) {
        // default socket
        client.emit('connect');
        return;
      }
      const req = http.request({
        host: proxy.host,
        port: proxy.port,
        method: 'CONNECT',
        path: `${config.MINECRAFT_HOST}:${config.MINECRAFT_PORT}`
      });
      req.on('connect', (res, stream) => {
        if (res.statusCode === 200) {
          client.setSocket(stream);
          client.emit('connect');
        } else {
          const error = new Error(`Proxy connect failed: ${res.statusCode} ${res.statusMessage}`);
          channel.send(`[PROXY ERROR] **${username}** - \`${error.message}\``);
          client.emit('error', error);
        }
      });
      req.on('error', (err) => {
        channel.send(`[PROXY ERROR] **${username}** - Error connecting to proxy (\`${proxyString}\`): \`${err.message}\``);
        client.emit('error', err);
      });
      req.end();
    }
  };

  const bot = mineflayer.createBot(botOptions);
  bot.loadPlugin(pathfinder);

  const mcData = mcDataPackage(bot.version);
  const defaultMove = new Movements(bot, mcData);
  defaultMove.allowSprinting = true;
  defaultMove.canDig = false;
  defaultMove.canOpenDoors = false;

  bot.shouldReconnect = false;
  bot.usedProxy = proxyString;
  bot.usedPort = currentViewerPort;
  bot.discordChannel = channel;
  bot.defaultMove = defaultMove;

  botMap.set(username, { bot, channel });

  bot.on('message', async (jsonMsg) => {
    const text = jsonMsg.toString().trim();
    if (!text) return;

    if (!chatBuffers.has(bot.username)) chatBuffers.set(bot.username, []);
    chatBuffers.get(bot.username).push(text);

    flushChatBuffers();

    if (text.includes("Чтобы зарегистрироваться, решите каптчу используя команду")) {
        const parts = text.split("«");
        if (parts.length > 1) {
            const second_parts = parts[1].trim().split("»");
            const command = second_parts[0].trim();
            bot.chat(`${command}`);
        }
    } else if (text.includes("Регистрация: /reg")) {
        const password = `${username}1`;
        bot.chat(`/register ${password} ${password}`);
        bot.discordChannel.send(`[INFO] Attempting to register ${username} with password: \`${password}\``);
    } else if (text.includes("Авторизация: /login")) {
        bot.chat(`/login ${username}1`);
    } else if (text.includes("Вы вошли, приятной игры!")) {
        bot.discordChannel.send(`[LOGIN] **${bot.username}** successfully logged in.`);
        await sleep(3000);
        bot.chat("/afkzone");
        //hex = generateRandomHexColor();
        //bot.chat(`/skin https://iforgorenko.pythonanywhere.com/recolor?hex=${hex}`);
    } else if (text.includes("PvP Вас атаковал игрок")) {
        bot.shouldReconnect = true; 
        bot.end(); 
    }
  });

  bot.on('error', err => {
    console.error(`[BOT ERROR][${bot.username}]`, err.message);
  });

  bot.on('kicked', (reason) => {
    console.log(`[KICKED][${username}]`, reason);
    bot.discordChannel.send(`[KICKED] **${username}** - \`${reason}\``);

    formated = reason.toString();
    if (formated.includes("Мы проверили ваше подключение!")) {
        bot.shouldReconnect = true; 
        bot.end(); 
    }
  });

  bot.on('end', reason => {
    console.log(`[END][${bot.username}] Disconnect Reason: ${reason}`);
    if (bot.shouldReconnect) {
      const delay = Math.floor(Math.random() * (3200 - 1000 + 1)) + 1000;
      setTimeout(() => {
        makeBot(username, bot.usedProxy);
      }, delay);
    }
  });

  bot.once('spawn', async () => {
    await sleep(5000);
    if (!bot.viewer) {
      try {
        mineflayerViewer(bot, { port: currentViewerPort });
        try {
          await bot.discordChannel.setTopic(`http://localhost:${currentViewerPort}/`);
        } catch (e) {}
      } catch (e) {
        console.error('Viewer error', e.message);
      }
    }

    if (bot.viewer) {
      bot.viewer.on('blockClicked', (block, face, button) => {
        if (button !== 2) return;
        const p = block.position.offset(0, 1, 0);
        bot.pathfinder.setMovements(bot.defaultMove);
        bot.pathfinder.setGoal(new (require('mineflayer-pathfinder').goals).GoalBlock(p.x, p.y, p.z));
      });
    }
  });

  return bot;
}

module.exports = { makeBot, botMap };
