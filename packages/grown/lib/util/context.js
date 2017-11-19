'use strict';

const debug = require('debug')('grown:context');

const STATUS_CODES = require('http').STATUS_CODES;

const util = require('./object');
const proc = require('./process');

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

function buildError(code, description) {
  const message = STATUS_CODES[code];
  const errObj = new Error(description || message);

  errObj.statusMessage = message;
  errObj.statusCode = code;

  return errObj;
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

function endCallback(err, conn, options) {
  return Promise.resolve()
    .then(() => {
      /* istanbul ignore else */
      if (typeof conn.end === 'function') {
        return Promise.resolve()
          .then(() => {
            if (err) {
              const failure = proc.cleanError(err, options('cwd'));

              conn.set_status(failure.code);
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
            const failure = proc.cleanError(err, options('cwd'));

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
      if (!(conn.res && conn.res.finished)) {
        return this._events.emit('before_send', err, conn, options)
          .catch(e => {
            debug('#%s Fatal. %s', conn.pid, e.stack);
          });
      }
    })
    .then(() => {
      /* istanbul ignore else */
      if (typeof conn.end === 'function' && !conn.halted) {
        return conn.end();
      }

      /* istanbul ignore else */
      if (conn.res && !conn.res.finished) {
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
    .catch(e => _finish(e, conn, options))
    .then(() => {
      this._events.emit('finished', err, conn, options);
    });
}

module.exports = {
  buildSettings,
  buildPubsub,
  buildError,
  endCallback,
  doneCallback,
};
