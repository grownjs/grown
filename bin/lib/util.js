'use strict';

/* eslint-disable prefer-rest-params */

const cleanStack = require('clean-stack');

const die = process.exit.bind(process);

function _getError(e, flags) {
  return flags
    ? (flags.debug && cleanStack(e.stack)) || e.message
    : cleanStack(e.stack);
}

function _printError(e, flags, logger) {
  if (!logger || (flags && flags.quiet)) {
    process.stderr.write(`\r\x1b[31m${_getError(e, flags)}\x1b[0m\n`);
  } else {
    logger.info('\r{% error %s %}\r\n', _getError(e, flags));
  }
}

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
  getError: _getError,
  printError: _printError,
};
