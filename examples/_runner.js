/* eslint-disable global-require */

process.env.UWS = process.argv.indexOf('--uws') > -1 ? 1 : 0;

if (process.argv.indexOf('--debug') > -1) {
  require('debug').enable('*');
}

require(`./${process.argv.slice(2)[0]}`);
