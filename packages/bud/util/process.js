'use strict';

const vm = require('vm');
const cleanStack = require('clean-stack');

const RE_ERR_MESSAGE = /.*Error:.+?\n/;
const RE_NODE_MODULES = /\/.+?node_modules\//g;
const RE_NO_SPACES = / +at /g;
const RE_SRC_FILE = /[/.].+?:\d+:\d+/;

const RE_NATIVES = new RegExp(`^.+(${
  Object.keys(process.binding('natives'))
    .concat('bootstrap_node', 'node')
    .join('|')
})\\.js(?!:).+$`, 'gm');

const RE_INTERPOLATE = /`([^`]+)`/g;

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
    .filter(key => key.indexOf(cwd) === 0 && key.indexOf('node_modules') === -1)
    .forEach(_purgeCache);
}

function cleanError(e, cwd) {
  let _stack = cleanStack(e.stack || new Error().stack || '')
    .replace(/^.+(es6-promise|bluebird|internal).+$/gm)
    .replace(/^[ ]*at \/.*node_modules.*$/gm, '')
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

  let _e;

  if (!(e instanceof Error)) {
    _e = new Error(e);
  } else {
    _e = e;
  }

  /* istanbul ignore else */
  if (typeof e === 'object') {
    _e.errors = e.errors || [];
    _e.call = e.pipeline;
    _e.name = e.name || 'Error';
    _e.code = e.statusCode || 500;
  }

  const message = (e.stack || _e.message || _e.name).match(RE_ERR_MESSAGE);

  _e.stack = `${message ? message[0].trim() : _e.name}\n${_stack.split('\n')
    .filter(line => RE_SRC_FILE.test(line))
    .join('\n')}`;

  return _e;
}

function invoke(value, context, interpolate) {
  /* istanbul ignore else */
  if (!interpolate) {
    return vm.runInNewContext(value, context);
  }

  return value.replace(RE_INTERPOLATE, ($0, $1) => vm.runInNewContext($1, context));
}

function wrap(callback) {
  let _errCallback;

  function err(message) {
    /* istanbul ignore else */
    if (message) {
      try {
        process.stderr.write(`\r\x1b[31m${message}\x1b[0m\n`);
      } catch (e) {
        process.stderr.write(`\r\x1b[31m${e.stack}\x1b[0m\n`);
      }
    }

    process.exit(1);
  }

  function ifErr(cb) {
    _errCallback = cb;
  }

  return function $end(done) {
    const self = this;

    function end(ex) {
      try {
        if (ex) {
          /* istanbul ignore else */
          if (_errCallback) {
            _errCallback.call(self, ex);
          }

          const msg = [];

          /* istanbul ignore else */
          if (ex.name && ex.name.indexOf('Sequelize') !== -1) {
            if (ex.errors) {
              msg.push('Errors:');

              ex.errors.forEach(error => {
                msg.push(`- ${error.message} (${error.type})`);
              });
            } else {
              msg.push(`${ex.original.message}:`);
              msg.push(`- ${ex.sql}`);
            }
          }

          msg.push(cleanError(ex).stack || ex.toString());

          err(msg.join('\n'));
        }
      } catch (e) {
        err(e.stack || e.toString());
      } finally {
        /* istanbul ignore else */
        if (typeof done === 'function') {
          done.call(self, ex);
        }
      }
    }

    return Promise.resolve()
      .then(() => callback.call(self, ifErr))
      .then(() => end())
      .catch(end);
  };
}

module.exports = {
  clearModules,
  cleanError,
  invoke,
  wrap,
};
