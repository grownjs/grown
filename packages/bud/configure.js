'use strict';

const _env = require('dotenv');
const path = require('path');

module.exports = ($, cwd, argv, util) => {
  const _loader = (_cwd, suffix, callback) => {
    if (typeof suffix === 'function') {
      callback = suffix;
      suffix = '';
    }

    return util.scanDir(_cwd, suffix, cb => {
      let _module = cb($.Grown, util);

      if (typeof callback === 'function') {
        _module = callback(_module) || _module;
      }

      return _module;
    });
  };

  // props
  $('Grown.argv', () => argv, false);
  $('Grown.cwd', () => cwd, false);
  $('Grown.env', () => process.env.NODE_ENV, false);

  // methods
  $('Grown.load', _loader, false);
  $('Grown.use', cb => cb($.Grown, util), false);
  $('Grown.do', util.wrap, false);

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
