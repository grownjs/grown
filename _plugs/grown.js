'use strict';

const debug = require('debug')('grown');

const $new = require('object-new');

const util = require('../lib/util');

const _pkg = require('../package.json');

const _mount = require('../lib/api/mount_');
const _listen = require('../lib/api/listen_');

function $(id, props, extensions) {
  return $new(id, props, $, extensions);
}

function end(err, conn, options) {
  if (typeof conn.end === 'function') {
    return conn.end(err);
  }

  if (conn.res) {
    try {
      if (err) {
        conn.res.write(util.ctx.errorHandler(err, conn, options));
      }

      conn.res.end();
    } catch (e) {
      debug('#%s Fatal. %s', conn.pid, e.stack);

      conn.res.statusCode = 500;
      conn.res.setHeader('Content-Type', 'text/plain');
      conn.res.write([err && err.stack, e.stack].filter(x => x).join('\n\n'));
      conn.res.end();
    }
  }
}

function done(err, conn, options) {
  debug('#%s OK. Final handler reached', conn.pid);

  return Promise.resolve()
    .then(() => {
      if (!conn.res.finished) {
        return this._events.emit('before_send', conn, options);
      }
    })
    .then(() => {
      if (err) {
        throw err;
      }

      return end(null, conn, options);
    })
    .then(() => debug('#%s Finished.', conn.pid))
    .catch(e => end(e, conn, options));
}

function pubsub() {
  const _events = {};

  function ee(e) {
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

const Grown = $('Grown', options => {
  if (!(options && options.env && options.cwd)) {
    throw new Error('Missing environment config');
  }

  function _getConfig(key, defvalue) {
    let value;

    try {
      value = util.get(options, key, defvalue);
    } catch (e) {
      throw new Error(`Cannot resolve config: ${key}`);
    }

    return typeof value !== 'undefined' ? value : defvalue;
  }

  const scope = {};

  scope._hosts = {};
  scope._servers = {};
  scope._protocols = {};

  scope._extensions = [];
  scope._pipeline = [];
  scope._events = pubsub();

  scope._options = _getConfig;
  scope._invoke = util.ctx.pipelineFactory('^', scope._pipeline, done.bind(scope));

  return $({
    init() {
      return {
        methods: {
          on: scope._events.on.bind(this),
          off: scope._events.off.bind(this),
          once: scope._events.once.bind(this),
          emit: scope._events.emit.bind(this),
        },
      };
    },
    methods: {
      run(context, callback) {
        const conn = $(util.extend({}, context, {
          extensions: scope._extensions,
        }));

        return scope._invoke(conn, scope._options)
          .then(() => typeof callback === 'function' && callback(null, conn))
          .catch(e => typeof callback === 'function' && callback(e, conn))
          .then(() => conn);
      },

      plug(object) {
        const plugins = (!Array.isArray(object) && object)
          ? [object]
          : object;

        plugins.forEach(p => {
          try {
            Object.keys(p).forEach(k => {
              switch (k) {
                case 'before_send':
                  this.on(k, p[k]);
                  break;

                case 'install':
                  p.install(this, scope._options);
                  break;

                default:
                  if (k[0] !== k[0].toUpperCase()) {
                    $new.readOnlyProperty(this, k, p[k], {
                      isMethod: false,
                    });
                  }
                  break;
              }
            });
          } catch (e) {
            throw new Error(`${p.name} definition failed. ${e.message}`);
          }

          if (p.extensions) {
            p.extensions.forEach(x => {
              scope._extensions.push(x);
            });
          }
        });

        return this;
      },

      mount: _mount.bind(scope),

      listen: _listen.bind(scope),
    },
  });
});

$('Grown.version', () => _pkg.version, false);

$('Grown.module', (id, def) =>
  $(`Grown.${id}`, def), false);

$('Grown.use', cb =>
  cb(Grown, util), false);

module.exports = Grown;
