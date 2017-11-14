'use strict';

const cleanStack = require('clean-stack');

const RE_ERR_MESSAGE = /.*Error:.+?\n/;
const RE_NODE_MODULES = /\/.+?node_modules\//g;
const RE_NO_SPACES = / +at /g;
const RE_SRC_FILE = /^\S+\s\(.+?:\d+:\d+\)/;

const RE_NATIVES = new RegExp(`^.+(${
  Object.keys(process.binding('natives'))
    .concat('bootstrap_node', 'node')
    .join('|')
})\\.js.+$`, 'gm');

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

function clearModules(cwd) {
  Object.keys(require.cache)
    .filter(key =>
      key.indexOf(cwd) === 0 && key.indexOf('node_modules') === -1)
    .forEach(_purgeCache);
}

function cleanError(e, cwd) {
  let _stack = cleanStack(e.stack || '')
    .replace(/^.+(es6-promise|bluebird|internal|grown).+$/gm)
    .replace(RE_ERR_MESSAGE, '')
    .replace(RE_NATIVES, '');

  /* istanbul ignore else */
  if (_stack) {
    _stack = _stack.replace(RE_NO_SPACES, '');
    _stack = _stack.replace(RE_NODE_MODULES, '~');

    while (_stack.indexOf(cwd) > -1) {
      _stack = _stack.replace(cwd, '.');
    }
  }

  return {
    message: e.message || e.toString(),
    summary: e.description || e.summary,
    errors: e.errors || [],
    stack: _stack.split('\n')
      .filter(line => RE_SRC_FILE.test(line))
      .join('\n'),
    call: e.pipeline,
    name: e.name || 'Error',
    code: e.statusCode || 501,
  };
}

module.exports = {
  clearModules,
  cleanError,
};
