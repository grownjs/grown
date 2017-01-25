'use strict';

/* eslint-disable prefer-rest-params */

// runtime hooks
const Module = require('module');

function _clearModules() {
  Object.keys(Module._cache)
    .forEach((key) => {
      /* istanbul ignore else */
      if (key.indexOf('node_modules') === -1) {
        delete Module._cache[key];
      }
    });
}

const die = process.exit.bind(process);
const _slice = Array.prototype.slice;

function echo() {
  process.stdout.write(_slice.call(arguments).join(''));
}

function merge(target) {
  _slice.call(arguments, 1).forEach((source) => {
    Object.keys(source).forEach((key) => {
      /* istanbul ignore else */
      if (typeof target[key] === 'undefined') {
        target[key] = source[key];
      }
    });
  });

  return target;
}

function parseBool(value) {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return undefined;
}

module.exports = {
  die,
  echo,
  merge,
  slice: _slice,
  toBool: parseBool,
  clearModules: _clearModules,
};
