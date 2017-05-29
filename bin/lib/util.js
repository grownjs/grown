'use strict';

/* eslint-disable prefer-rest-params */

const cleanStack = require('clean-stack');

function _printError(e, flags, logger) {
  if (!logger || (flags && flags.quiet)) {
    process.stderr.write(`\r\x1b[31m${(flags && flags.debug && cleanStack(e.stack)) || e.message}\x1b[0m\n`);
  } else {
    logger.info('\r{% error %s %}\r\n', (flags.debug && cleanStack(e.stack)) || e.message);
  }
}

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
  printError: _printError,
  clearModules: _clearModules,
};
