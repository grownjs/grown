/* eslint-disable */

assert = require('assert');

const fs = require('fs');

fs.mkdirSync('./tasks');
fs.writeFileSync('./tasks/example.js',
  `module.exports = {
    description: 'Example task',
    callback() {
      console.log('It works.')
    },
  };`);

const { strip } = require ('ansicolor');

const toString = value => String(Buffer.from(value));
const normalizeText = msg => strip(msg.replace(/[\r\n\b]/g, ''));

process.stdout.write = msg => console.log(normalizeText(toString(msg)));
