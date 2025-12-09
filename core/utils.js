const util = require('util');
const fs = require('fs');

const sleep = (ms) => new Promise(res => setTimeout(res, ms));
const getRandomDelay = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const readFile = (fileName) => util.promisify(fs.readFile)(fileName, 'utf8');

function parseProxy(proxyString) {
  if (!proxyString) return null;
  const [host, port] = proxyString.split(':');
  return { host: host && host.trim(), port: port && parseInt(port.trim(), 10) };
}

function generateRandomHexColor() {
    const randomColor = Math.floor(Math.random() * 16777215);
    let hex = randomColor.toString(16);
    hex = '000000'.substring(0, 6 - hex.length) + hex;
    return hex.toUpperCase();
}

module.exports = { sleep, getRandomDelay, readFile, parseProxy, generateRandomHexColor };
