const fs = require('fs');
const assert = require('assert'); // eslint-disable-line

fs.mkdirSync('./exts');
fs.mkdirSync('./exts/Test');
fs.mkdirSync('./exts/Test/handler');

fs.writeFileSync('./exts/Test/handler/index.js', `
  module.exports = function () { return 42; };
`);
