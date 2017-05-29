'use strict';

/* eslint-disable prefer-rest-params */

// runtime hooks
const Module = require('module');

function _clearModules(cwd) {
  Object.keys(Module._cache)
    .forEach(key => {
      /* istanbul ignore else */
      if (key.indexOf('node_modules') === -1
        && (cwd && key.indexOf(cwd) === 0)) {
        delete Module._cache[key];
      }
    });
}

const die = process.exit.bind(process);

function extend(target) {
  Array.prototype.slice.call(arguments, 1).forEach(source => {
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
  extend,
  clearModules: _clearModules,
};
