'use strict';

const debug = require('debug')('grown:context');
const util = require('util');

const STATUS_CODES = require('http').STATUS_CODES;

function die(conn, error, options) {
  const failure = this._.cleanError(error, options('cwd'));

  /* istanbul ignore else */
  if (options('env') !== 'production' && failure.code > 499) {
    process.stderr.write(`${util.format('#%s Failure. %s', conn.pid, error.stack)}\n`);
  }

  try {
    /* istanbul ignore else */
    if (failure.summary) {
      conn.res.setHeader('X-Failure', `${failure.summary} (${failure.message})`);
    }

    conn.res.statusMessage = failure.statusMessage || STATUS_CODES[failure.code];
    conn.res.statusCode = failure.statusCode || failure.code;
    conn.res.write(conn.res.statusMessage);
    conn.res.end();
  } catch (e) {
    console.error('E_DIE', e);
  }
}

function buildSettings(data) {
  return (key, defvalue) => {
    let value;

    try {
      value = this._.getProp(data, key, defvalue);

      if (typeof value === 'function') {
        value = value(data);
      }
    } catch (e) {
      throw new Error(`Cannot resolve config: ${key}`);
    }

    if (typeof defvalue === 'undefined' && typeof value === 'undefined') {
      throw new Error(`Missing value for '${key}' option`);
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

  function ee(e, sent) {
    const key = e.toLowerCase();

    /* istanbul ignore else */
    if (!_events[key]) {
      _events[key] = [];
    }

    /* istanbul ignore else */
    if (sent) {
      _events[key]._sent = true;
    }

    return _events[key];
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

      /* istanbul ignore else */
      if (ee(e)._sent) {
        try {
          cb();
        } finally {
          return this; // eslint-disable-line
        }
      }

      function $once() {
        try {
          cb.apply(null, arguments);
        } finally {
          ee(e).splice(k, 1);
        }
      }

      k = ee(e).push($once) - 1;

      return this;
    },

    emit(e) {
      const args = Array.prototype.slice.call(arguments, 1);

      ee(e, true).forEach(fn => {
        fn.apply(null, args);
      });

      return this;
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
              conn.end(this._.cleanError(err, options('cwd')));
            }
          })
          .catch(e => {
            die.call(this, conn, e, options);
          });
      }

      /* istanbul ignore else */
      if (conn.res && !conn.halted) {
        /* istanbul ignore else */
        if (err) {
          die.call(this, conn, err, options);
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

        return conn.halt(() => conn.res.end(null));
      }
    })
    .catch(e => {
      if (e.code !== 'ERR_STREAM_WRITE_AFTER_END') {
        die.call(this, conn, e, options);
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
      this._events.emit('finished', conn, options);
    });
}

module.exports = {
  buildSettings,
  buildPubsub,
  buildError,
  endCallback,
  doneCallback,
};
