const args = process.argv.slice(2);
const cmd = args[0] && args[0].charAt() === '-' ? '' : args.shift();

const _ = require('./_util');

const $ = _.inputProps(args);

$.cmd = cmd;

module.exports = $;
