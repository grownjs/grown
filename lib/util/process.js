'use strict';

const _cleanStack = require('clean-stack');
const vm = require('vm');

const _die = process.exit.bind(process);

const reInterpolate = /`([^`]+)`/g;

function _getError(e, flags) {
  return flags
    ? (flags.debug && _cleanStack(e.stack)) || e.message
    : _cleanStack(e.stack);
}

// https://stackoverflow.com/questions/9210542/node-js-require-cache-possible-to-invalidate/14801711#14801711
function _searchCache(moduleName, callback) {
  const mod = require.resolve(moduleName);

  if (mod && typeof require.cache[mod] !== 'undefined') {
    const seen = [];

    (function traverse(_mod) {
      _mod.children.forEach(child => {
        if (seen.indexOf(child) === -1) {
          seen.push(child);
          traverse(child);
        }
      });

      callback(_mod);
    }(require.cache[mod]));
  }
}

function _purgeCache(moduleName) {
  _searchCache(moduleName, mod => {
    // skip bindings, avoid "Module did not self-register."  errors
    if (mod.id.indexOf('.node') === -1) {
      delete require.cache[mod.id];
    }
  });

  Object.keys(module.constructor._pathCache).forEach(cacheKey => {
    if (cacheKey.indexOf(moduleName) > 0) {
      delete module.constructor._pathCache[cacheKey];
    }
  });
}

function _clearModules(cwd) {
  Object.keys(require.cache)
    .filter(key =>
      key.indexOf(cwd) === 0 && key.indexOf('node_modules') === -1)
    .forEach(_purgeCache);
}

function _printError(e, flags, logger, important) {
  if (!logger || important || (flags && flags.quiet)) {
    process.stderr.write(`\r\x1b[31m${_getError(e, flags)}\x1b[0m\n`);
  } else {
    logger.info('\r{% error %s %}\r\n', _getError(e, flags));
  }
}

function _invoke(code, context) {
  return vm.runInNewContext(code.replace(reInterpolate, ($0, $1) => vm.runInNewContext($1, context)), context);
}

module.exports = {
  die: _die,
  invoke: _invoke,
  getError: _getError,
  printError: _printError,
  cleanStack: _cleanStack,
  clearModules: _clearModules,
};
