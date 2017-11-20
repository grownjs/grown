'use strict';

const debug = require('debug')('grown:ctx');

const STATUS_CODES = require('http').STATUS_CODES;

const objectNew = require('object-new');

const util = require('./object');

const errorHandler = require('./error_');
const buildFactory = require('./factory_');
const pipelineFactory = require('./pipeline');

function optionsFactory(data) {
  return (key, defvalue) => {
    let value;

    try {
      value = util.get(data, key, defvalue);
    } catch (e) {
      throw new Error(`Cannot resolve config: ${key}`);
    }

    return typeof value !== 'undefined' ? value : defvalue;
  };
}

function buildPipeline(name, pipeline) {
  return (!Array.isArray(pipeline) ? [pipeline] : pipeline)
    .map((cb, key) => {
      const factory = buildFactory(cb, `${name}.${key}`);

      // push task to pipeline
      return {
        name: factory.name || name,
        call: factory.call,
        type: factory.type || 'function',
      };
    });
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
      util.is('function', cb);
      ee(e).push(cb);

      return this;
    },

    off(e, cb) {
      util.is('function', cb);

      const p = ee(e);
      const q = p.indexOf(cb);

      /* istanbul ignore else */
      if (q > -1) {
        p.splice(q, 1);
      }

      return this;
    },

    once(e, cb) {
      util.is('function', cb);

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

// standard http error-codes
function error(code, description) {
  const message = STATUS_CODES[code];
  const errObj = new Error(description || message);

  errObj.statusMessage = message;
  errObj.statusCode = code;

  return errObj;
}

function load(context, handler, name) {
  // read from memory first
  let Handler = handler.original;

  /* istanbul ignore else */
  if (!Handler && handler.filepath) {
    // lazily load and set the original module
    Handler
      = handler.original
      = require(handler.filepath);

    /* istanbul ignore else */
    if (Array.isArray(Handler)) {
      throw new Error(`Expecting a valid handler, given '${Handler}'`);
    }

    // object-new support
    if (typeof Handler.init === 'function' || Handler.methods) {
      Handler = objectNew(name, Handler, context);
    } else {
      context[name] = Handler;
    }

    // using classes?
    const isClass =
      typeof Handler === 'function'
      && Handler.constructor && Handler.name;

    // class-like constructors are always instantiated
    handler.instance = isClass ? new Handler() : Handler;
  }

  return Handler;
}

function end(err, conn, options) {
  return Promise.resolve()
    .then(() => {
      /* istanbul ignore else */
      if (typeof conn.end === 'function') {
        return Promise.resolve()
          .then(() => {
            if (err) {
              conn.resp_body = errorHandler(err, conn, options);
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
            conn.res.write(errorHandler(err, conn, options));
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

function done(err, conn, options) {
  debug('#%s OK. Final handler reached', conn.pid);

  const _finish = end.bind(this);

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
  pipelineFactory,
  optionsFactory,
  buildPipeline,
  buildFactory,
  buildPubsub,
  errorHandler,
  error,
  load,
  done,
  end,
};
