/* eslint-disable */

assert = require('assert');

const fs = require('fs');

fs.mkdirSync('./exts');
fs.mkdirSync('./exts/Test');
fs.mkdirSync('./exts/Test/handler');

fs.writeFileSync('./exts/Test/handler/index.js', `
  module.exports = function () { return 42; };
`);
