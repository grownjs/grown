'use strict';

const debug = require('debug')('grown');

const $new = require('object-new');

const _pkg = require('./package.json');

const util = require('./lib/util');
const _mount = require('./lib/mount');
const _listen = require('./lib/listen');

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
    return $('Grown.Conn.Builder')({
      name: `Grown.Conn#${Math.random().toString(36).substr(2)}`,
      props: {
        env: () => _environment,
      },
      init() {
        return [
          !this.pid && {
            props: {
              pid: () => process.pid,
            },
          },
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
                this.emit('failure', e, conn, scope._options);

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

            /* istanbul ignore else */
            if (typeof p.before_send === 'function') {
              this.on('before_send', p.before_send.bind(p));
            }

            /* istanbul ignore else */
            if (typeof p.pipe === 'function') {
              scope._pipeline.push({
                name: p.class || p.name || '!?',
                call: [p, 'pipe'],
                type: 'method',
              });
            }

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
