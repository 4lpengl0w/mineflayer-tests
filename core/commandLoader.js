const fs = require('fs');
const path = require('path');

const commands = new Map();

function loadCommands() {
  commands.clear();
  const dir = path.join(__dirname, '..', 'commands');
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));
  for (const f of files) {
    const full = path.join(dir, f);
    delete require.cache[require.resolve(full)];
    const cmd = require(full);
    if (cmd && cmd.name && typeof cmd.execute === 'function') {
      commands.set(cmd.name, cmd);
    }
  }
  console.log(`[COMMANDS] Loaded ${commands.size} commands.`);
}

function reloadCommands() {
  loadCommands();
}

module.exports = { commands, loadCommands, reloadCommands };
