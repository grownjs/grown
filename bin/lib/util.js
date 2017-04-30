'use strict';

/* eslint-disable prefer-rest-params */

// runtime hooks
const Module = require('module');

function _clearModules() {
  Object.keys(Module._cache)
    .forEach(key => {
      /* istanbul ignore else */
      if (key.indexOf('node_modules') === -1) {
        delete Module._cache[key];
      }
    });
}

const die = process.exit.bind(process);
const _slice = Array.prototype.slice;

const CLR = '\x1b[K';

function echo() {
  process.stdout.write(Array.prototype.slice.call(arguments).join('')
    .replace(/\r\r/g, `${CLR}\r`)
    .replace(/\r\n/g, `${CLR}\n`));
}

function merge(target) {
  _slice.call(arguments, 1).forEach(source => {
    Object.keys(source).forEach(key => {
      /* istanbul ignore else */
      if (typeof target[key] === 'undefined') {
        target[key] = source[key];
      }
    });
  });

  return target;
}

module.exports = {
  die,
  echo,
  merge,
  slice: _slice,
  clearModules: _clearModules,
};
