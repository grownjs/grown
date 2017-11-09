'use strict';

const debug = require('debug')('grown');

const $new = require('object-new');

const util = require('../legacy/lib/util');

const _pkg = require('../legacy/package.json');

const _mount = require('../legacy/lib/api/mount_');
const _listen = require('../legacy/lib/api/listen_');

function $(id, props, extensions) {
  return $new(id, props, $, extensions);
}

function end(err, conn, options) {
  return Promise.resolve()
    .then(() => {
      /* istanbul ignore else */
      if (typeof conn.end === 'function') {
        return Promise.resolve()
          .then(() => {
            if (err) {
              conn.resp_body = util.ctx.errorHandler(err, conn, options);
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
            conn.res.write(util.ctx.errorHandler(err, conn, options));
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

const Grown = $('Grown', options => {
  /* istanbul ignore else */
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
  scope._events = util.ctx.buildPubsub();

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

        (plugins || []).reduce((prev, cur) => {
          /* istanbul ignore else */
          if (typeof cur === 'undefined') {
            throw new Error(`Invalid extension, given '${cur}'`);
          }

          /* istanbul ignore else */
          if (cur) {
            if (Array.isArray(cur)) {
              Array.prototype.push.apply(prev, cur.filter(x => x));
            } else {
              prev.push(cur);
            }
          }

          return prev;
        }, []).forEach(p => {
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
                  /* istanbul ignore else */
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

          /* istanbul ignore else */
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
