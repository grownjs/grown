'use strict';

const _env = require('dotenv');
const path = require('path');

const util = require('./util');

module.exports = ($, cwd, argv, Grown) => {
  const _pkg = require(path.join(cwd, 'package.json'));

  $('Grown.version', () => _pkg.version, false);
  $('Grown.argv', () => argv, false);
  $('Grown.cwd', () => cwd, false);
  $('Grown.env', () => process.env.NODE_ENV, false);
  $('Grown.use', cb => cb(Grown, util), false);

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
