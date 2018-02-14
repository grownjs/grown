'use strict';

const wargs = require('wargs');

// @grown/grown barebones
module.exports = (cwd, argv) => {
  const _argv = wargs(argv || process.argv.slice(2), {
    boolean: ['V', 'd', 'help'],
    alias: {
      V: 'verbose',
      d: 'debug',
      e: 'env',
    },
  });

  // defaults
  process.name = 'Grown (bare)';

  process.env.NODE_ENV = _argv.flags.env || process.env.NODE_ENV || 'development';

  Object.keys(_argv.data).forEach(key => {
    /* istanbul ignore else */
    if (RE_UPPER.test(key)) {
      process.env[key] = _argv.data[key];
    }
  });

  /* istanbul ignore else */
  if (process.env.CI && process.env.NODE_ENV.indexOf('test') === 0) {
    process.env.NODE_ENV = 'ci';
  }

  delete _argv.flags.env;

  /* istanbul ignore else */
  if (_argv.flags.debug && _argv.flags.verbose) {
    require('debug').enable('*');
  }

  // private container
  function $(id, props, extensions) {
    return $new(id, props, $, extensions);
  }

  const Grown = $('Grown', () => {
    throw new Error('Not implemented');
  });

  $('Grown.version', () => _pkg.version, false);
  $('Grown.argv', () => _argv, false);
  $('Grown.cwd', () => cwd || process.cwd(), false);
  $('Grown.env', () => process.env.NODE_ENV, false);
  $('Grown.use', cb => cb(Grown, util), false);

  const env = _env.config({
    path: path.join(Grown.cwd, '.env'),
  });

  if (env.error && env.error.code !== 'ENOENT') {
    throw env.error;
  }

  // cleanup
  delete process.env.error;
  delete env.error;

  return Grown;
};
