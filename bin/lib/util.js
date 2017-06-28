'use strict';

/* eslint-disable prefer-rest-params */

const cleanStack = require('clean-stack');

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

function _sortModels(deps) {
  const map = {};
  const out = [];

  deps.forEach(model => {
    map[model.name] = Object.keys(model.refs)
      .map(ref => model.refs[ref].target.name)
      .reduce((prev, cur) => {
        if (prev.indexOf(cur) === -1) {
          prev.push(cur);
        }
        return prev;
      }, []);
  });

  Object.keys(map).forEach(root => {
    if (!map[root].length) {
      if (out.indexOf(root) === -1) {
        out.unshift(root);
      }
    } else {
      if (out.indexOf(root) === -1) {
        out.push(root);
      }

      map[root].forEach(sub => {
        if (out.indexOf(sub) === -1) {
          out.unshift(sub);
        } else {
          out.splice(out.indexOf(root), 1);
          out.push(root);
        }
      });
    }
  });

  return out;
}

module.exports = {
  die,
  extend,
  getError: _getError,
  printError: _printError,
  clearModules: _clearModules,
  sortModelsByRefs: _sortModels,
};
