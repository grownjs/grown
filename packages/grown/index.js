'use strict';

const debug = require('debug')('grown');

const $new = require('object-new');

const _pkg = require('./package.json');

const util = require('./lib/util');
const _mount = require('./lib/mount');
const _listen = require('./lib/listen');

require('dotenv').config();

let _pid = 0;

function $(id, props, extensions) {
  return $new(id, props, $, extensions);
}

function fix(mixins) {
  /* istanbul ignore else */
  if (typeof mixins === 'function' && !mixins.class) {
    return mixins.bind(this);
  }

  /* istanbul ignore else */
  if (Array.isArray(mixins)) {
    return mixins.map(mix => fix.call(this, mix));
  }

  return mixins;
}

const Grown = $('Grown', options => {
  /* istanbul ignore else */
  if (!(options && options.env && options.cwd)) {
    throw new Error('Missing environment config');
  }

  debug('#%s Grown v%s - %s', process.pid, _pkg.version, options.env);

  const scope = {};

  scope._hosts = {};
  scope._servers = {};
  scope._protocols = {};

  scope._pipeline = [];
  scope._extensions = [];

  scope._events = util.buildPubsub();
  scope._options = util.buildSettings(options);
  scope._callback = util.buildPipeline('^', scope._pipeline, util.doneCallback.bind(scope));

  // skip npm-cli keys
  const _environment = {};

  Object.keys(process.env).forEach(key => {
    if (key.indexOf('npm_') === -1) {
      _environment[key] = process.env[key];
    }
  });

  // built-in connection
  scope._connection = (request, _extensions) => {
    const PID = `${process.pid}.${_pid}`;

    let _halted = null;

    return $('Grown.Conn.Builder')({
      name: `Grown.Conn#${PID}`,
      props: {
        pid: () => PID,
        env: () => _environment,

        // read-only
        get halted() {
          return _halted || (this.res && this.res.finished) || (this.has_body && this.has_status);
        },
      },
      methods: {
        halt() {
          _halted = true;
        },
        raise(code, message) {
          throw util.buildError(code || 500, message);
        },
      },
      init() {
        _pid += 1;

        return [
          _extensions,
          scope._extensions,
        ];
      },
    }).new(request);
  };

  return {
    init() {
      util.mergeMethodsInto.call(this, this, scope._events);

      this.once('begin', () => this.emit('start'));
      this.once('listen', () => this.emit('start'));
    },
    methods: {
      run(request, callback) {
        return Promise.resolve()
          .then(() => this.emit('begin'))
          .then(() => {
            const conn = scope._connection(request || {});

            return Promise.resolve()
              .then(() => {
                this.emit('request', conn, scope._options);
              })
              .then(() => scope._callback(conn, scope._options))
              .then(() => typeof callback === 'function' && callback(null, conn))
              .catch(e => {
                this.emit('failure', e, scope._options);

                /* istanbul ignore else */
                if (typeof callback === 'function') {
                  return callback(e, conn);
                }
              })
              .then(() => conn);
          });
      },

      plug() {
        util.flattenArgs(arguments).forEach(p => {
          try {
            if (typeof p === 'function') {
              debug('#%s Install <%s>', process.pid, p.class || p.name);
            } else {
              debug('#%s Install <{ %s }>', process.pid, Object.keys(p).join(', '));
            }

            Object.keys(p).forEach(k => {
              if (k.indexOf('before_') === 0) {
                this.on(k, p[k].bind(p));
              }
            });

            if (p.mixins) {
              scope._extensions.push(fix.call(p, p.mixins));
            } else if (p.extensions) {
              p.extensions.forEach(x => {
                /* istanbul ignore else */
                if (x.mixins) {
                  scope._extensions.push(fix.call(p, x.mixins));
                }
              });
            }

            /* istanbul ignore else */
            if (typeof p.install === 'function') {
              util.flattenArgs(p.install.call(p, this, scope._options)).forEach(def => {
                /* istanbul ignore else */
                if (Object.prototype.toString.call(def) === '[object Object]') {
                  util.mergeDefinitionsInto.call(p, this, def);
                }
              });
            }
          } catch (e) {
            if (p.class || p.name) {
              throw new Error(`${p.class || p.name} definition failed\n${e.stack}`);
            } else {
              throw new Error(`${e.stack}\nGiven '{${Object.keys(p).join(', ')}}'`);
            }
          }
        });

        return this;
      },

      mount: _mount.bind(scope),

      listen: _listen.bind(scope),
    },
  };
});

$('Grown.version', () => _pkg.version, false);

$('Grown.module', (id, def) =>
  $(`Grown.${id}`, def), false);

$('Grown.use', cb =>
  cb(Grown, util), false);

module.exports = Grown;
