'use strict';

const _env = require('dotenv');
const path = require('path');

module.exports = ($, cwd, argv, util) => {
  // setup loader
  require('global-or-local').bind('~/', cwd);

  // props
  $('Grown.argv', () => argv, false);
  $('Grown.cwd', () => cwd, false);
  $('Grown.pkg', () => require(`${cwd}/package.json`), false);
  $('Grown.env', () => process.env.NODE_ENV || 'development', false);

  // methods
  $('Grown.load', (_cwd, hooks) => util.scanDir(_cwd, def => def($.Grown, hooks || {})), false);
  $('Grown.defn', (name, fn) => $(`Grown.${name}`, fn, false), false);
  $('Grown.eff', cb => cb(util.buildState()), false);
  $('Grown.use', cb => cb($.Grown, util), false);
  $('Grown.do', util.wrap, false);

  const env = _env.config({ path: path.join(cwd, '.env') });

  /* istanbul ignore else */
  if (env.error && env.error.code !== 'ENOENT') {
    throw env.error;
  }

  // cleanup
  delete process.env.error;
  delete env.error;
};
