'use strict';

const wargs = require('wargs')
const $new = require('object-new');

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

  // private container
  const $ = function $(id, props, extensions) {
    return $new(id, props, $, extensions);
  };

  const Grown = $('Grown', () => {
    throw new Error('Not implemented');
  });

  // defaults
  process.name = 'Grown (bare)';

  require('./environment')(_argv);
  require('./configure')($, cwd || process.cwd(), _argv, Grown);

  return Grown;
};
