'use strict';

const debug = require('debug')('grown:context');

const cleanStack = require('clean-stack');

const util = require('./object');

const RE_ERR_MESSAGE = /.*Error:.+?\n/;
const RE_NODE_MODULES = /\/.+?node_modules\//g;
const RE_NO_SPACES = / +at /g;
const RE_SRC_FILE = /^\S+\s\(.+?:\d+:\d+\)/;

const RE_NATIVES = new RegExp(`^.+(${
  Object.keys(process.binding('natives'))
    .concat('bootstrap_node', 'node')
    .join('|')
})\\.js.+$`, 'gm');

function buildSettings(data) {
  return (key, defvalue) => {
    let value;

    try {
      value = util.getProp(data, key, defvalue);
    } catch (e) {
      throw new Error(`Cannot resolve config: ${key}`);
    }

    return typeof value !== 'undefined'
      ? value
      : defvalue;
  };
}

function buildPubsub() {
  const _events = {};

  function ee(e) {
    /* istanbul ignore else */
    if (!_events[e.toLowerCase()]) {
      _events[e.toLowerCase()] = [];
    }

    return _events[e.toLowerCase()];
  }

  return {
    on(e, cb) {
      ee(e).push(cb);

      return this;
    },

    off(e, cb) {
      const p = ee(e);
      const q = p.indexOf(cb);

      /* istanbul ignore else */
      if (q > -1) {
        p.splice(q, 1);
      }

      return this;
    },

    once(e, cb) {
      let k;

      function $once() {
        try {
          return cb.apply(null, arguments);
        } catch (_e) {
          throw _e;
        } finally {
          ee(e).splice(k, 1);
        }
      }

      k = ee(e).push($once) - 1;

      return this;
    },

    emit(e) {
      const args = Array.prototype.slice.call(arguments, 1);

      return ee(e)
        .reduce((prev, cur) =>
          prev.then(() => cur.apply(null, args)), Promise.resolve()).then(() => this);
    },
  };
}

function buildError(e, cwd) {
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
    code: e.statusCode || 500,
  };
}

function endCallback(err, conn, options) {
  return Promise.resolve()
    .then(() => {
      /* istanbul ignore else */
      if (typeof conn.end === 'function') {
        return Promise.resolve()
          .then(() => {
            if (err) {
              const failure = buildError(err, options('cwd'));

              conn.put_status(failure.code);
              conn.resp_body = failure.message;
            }
          })
          .catch(e => {
            debug('#%s Fatal. %s', conn.pid, e.stack);
          });
      }

      /* istanbul ignore else */
      if (conn.res && !(conn.res.finished && conn.halted)) {
        conn.res.statusCode = 501;

        try {
          /* istanbul ignore else */
          if (err) {
            const failure = buildError(err, options('cwd'));

            conn.res.statusCode = failure.code;
            conn.res.write(failure.message);
          }
        } catch (e) {
          debug('#%s Fatal. %s', conn.pid, e.stack);
        }
      }
    })
    .then(() => {
      /* istanbul ignore else */
      if (!((conn.res && conn.res.finished) || conn.halted)) {
        return this._events.emit('before_send', conn, options);
      }
    })
    .then(() => {
      /* istanbul ignore else */
      if (typeof conn.end === 'function') {
        return conn.end();
      }

      /* istanbul ignore else */
      if (conn.res) {
        conn.res.end();
      }
    })
    .catch(e => {
      debug('#%s Fatal. %s', conn.pid, e.stack);

      /* istanbul ignore else */
      if (conn.res) {
        conn.res.end();
      }
    });
}

function doneCallback(err, conn, options) {
  debug('#%s OK. Final handler reached', conn.pid);

  const _finish = endCallback.bind(this);

  return Promise.resolve()
    .then(() => {
      /* istanbul ignore else */
      if (err) {
        throw err;
      }

      return _finish(null, conn, options);
    })
    .then(() => debug('#%s Finished.', conn.pid))
    .catch(e => _finish(e, conn, options));
}

module.exports = {
  buildSettings,
  buildPubsub,
  endCallback,
  doneCallback,
};