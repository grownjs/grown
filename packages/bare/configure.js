'use strict';

const _env = require('dotenv');
const path = require('path');

const util = require('./util');

module.exports = ($, cwd, argv, Grown) => {
  const _loader = (cwd, suffix) => util.scanDir(cwd, suffix, cb => cb(Grown, util));
  const _pkg = require(path.join(cwd, 'package.json'));

  function getLogger() {
    if (Grown.Logger) {
      return msg => Grown.Logger.getLogger().printf('\r\r{% error %s %}\n', msg);
    }
  }

  $('Grown.version', () => _pkg.version, false);
  $('Grown.loader', () => _loader, false);
  $('Grown.argv', () => argv, false);
  $('Grown.cwd', () => cwd, false);
  $('Grown.env', () => process.env.NODE_ENV, false);
  $('Grown.use', cb => cb(Grown, util), false);
  $('Grown.do', cb => util.wrap(cb, getLogger), false);

  const env = _env.config({
    path: path.join(cwd, '.env'),
  });

  if (env.error && env.error.code !== 'ENOENT') {
    throw env.error;
  }

  // cleanup
  delete process.env.error;
  delete env.error;
};
