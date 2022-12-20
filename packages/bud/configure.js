'use strict';

const _env = require('dotenv');
const path = require('path');

module.exports = ($, cwd, argv, util) => {
  // setup loader
  require('global-or-local').bind('~/', cwd);

  const deferred = [];

  function load(mod, callback) {
    if (typeof mod === 'function') return callback(mod);
    const promise = Promise.resolve(mod).then(result => {
      return callback(result.default || result);
    });
    deferred.push(promise);
    return promise;
  }

  // props
  $('Grown.argv', () => argv, false);
  $('Grown.cwd', () => cwd, false);
  $('Grown.pkg', () => require(`${cwd}/package.json`), false);
  $('Grown.env', () => process.env.NODE_ENV || 'development', false);

  // methods
  $('Grown.use', mod => load(mod, cb => cb($.Grown, util)), false);
  $('Grown.main', (mod, fn) => $.Grown.ready(() => util.run(mod, fn)), false);
  $('Grown.ready', cb => Promise.all(deferred).then(() => cb && cb($.Grown, util)), false);
  $('Grown.load', (_cwd, hooks) => util.scanDir(_cwd, def => def($.Grown, hooks || {})), false);
  $('Grown.def', (name, _cwd, opts) => util.define($.Grown, name, _cwd, opts), false);
  $('Grown.defn', (name, fn) => $(`Grown.${name}`, fn, false), false);
  $('Grown.do', cb => util.wrap(cb), false);

  // exposes helper for aliasing
  Object.defineProperty($.Grown, 'bind', { value: require('global-or-local').bind });

  const env = _env.config({ path: path.join(cwd, '.env') });

  /* istanbul ignore else */
  if (env.error && env.error.code !== 'ENOENT') {
    throw env.error;
  }

  /* istanbul ignore else */
  if (argv.flags.silent) {
    process.silent = true;
  }

  // cleanup
  delete process.env.error;
  delete env.error;
};
