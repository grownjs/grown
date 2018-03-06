'use strict';

const _env = require('dotenv');
const path = require('path');

module.exports = ($, cwd, argv, util) => {
  const _loader = (_cwd, suffix) => util.scanDir(_cwd, suffix, cb => cb($.Grown, util));

  // props
  $('Grown.argv', () => argv, false);
  $('Grown.cwd', () => cwd, false);
  $('Grown.env', () => process.env.NODE_ENV, false);

  // methods
  $('Grown.load', () => _loader, false);
  $('Grown.use', cb => cb($.Grown, util), false);
  $('Grown.do', cb => util.wrap(cb, util), false);

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
