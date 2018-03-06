'use strict';

const debug = require('debug')('grown:context');

const STATUS_CODES = require('http').STATUS_CODES;

function buildSettings(data) {
  return (key, defvalue) => {
    let value;

    try {
      value = this.getProp(data, key, defvalue);
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
              conn.end(this.cleanError(err, options('cwd')));
            }
          })
          .catch(e => {
            debug('#%s Fatal. %s', conn.pid, e.stack);
          });
      }

      /* istanbul ignore else */
      if (conn.res && !conn.halted) {
        try {
          /* istanbul ignore else */
          if (err) {
            const failure = this.cleanError(err, options('cwd'));

            conn.res.statusCode = failure.code;
            conn.res.write(failure.message);
            conn.res.end();
          }
        } catch (e) {
          debug('#%s Fatal. %s', conn.pid, e.stack);
        }
      }
    })
    .then(() => {
      /* istanbul ignore else */
      if (conn.res && !conn.res.finished) {
        /* istanbul ignore else */
        if (typeof conn.end === 'function') {
          return conn.end();
        }

        return conn.halt(() => conn.res.end());
      }
    })
    .catch(e => {
      debug('#%s Fatal. %s', conn.pid, e.stack);
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
      this._events.emit('finished', conn, options);
    });
}

module.exports = util => ({
  buildSettings: buildSettings.bind(util),
  buildPubsub,
  buildError,
  endCallback,
  doneCallback,
});