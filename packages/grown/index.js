'use strict';

const debug = require('debug')('grown');

const wargs = require('wargs');
const $new = require('object-new');

const _pkg = require('./package.json');

const util = require('./lib/util');
const _mount = require('./lib/mount');
const _listen = require('./lib/listen');

let _pid = 0;

function bind(mixins) {
  /* istanbul ignore else */
  if (typeof mixins === 'function' && !mixins.class) {
    return mixins.bind(this);
  }

  /* istanbul ignore else */
  if (Array.isArray(mixins)) {
    return mixins.map(mix => bind.call(this, mix));
  }

  return mixins;
}

function grownFactory($, options) {
  options = options || {};

  // shared defaults
  options.cwd = $.Grown.cwd;
  options.env = $.Grown.env;

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
    /* istanbul ignore else */
    if (key.indexOf('npm_') === -1) {
      _environment[key] = process.env[key];
    }
  });

  $('Grown.Conn.Builder', {
    methods: {
      halt(cb) {
        /* istanbul ignore else */
        if (this.res && this.res._halted) {
          throw new Error('Connection already halted!');
        }

        /* istanbul ignore else */
        if (this.res) {
          this.res._halted = true;
        }

        return scope._events.emit('before_send', null, this, scope._options)
          .then(() => typeof cb === 'function' && cb(this, scope._options))
          .catch(e => {
            scope._events.emit('failure', e, scope._options);

            debug('#%s Fatal. %s', this.pid, e.stack);

            /* istanbul ignore else */
            if (typeof cb === 'function') {
              return cb(e, this, scope._options);
            }
          });
      },
      raise(code, message) {
        throw util.buildError(code || 500, message);
      },
    },
    props: {
      env: () => _environment,

      // read-only
      get halted() {
        return (this.res && this.res.finished) || this.has_body || this.has_status;
      },

      get state() {
        return util.extendValues({}, this.res.locals);
      },

      set state(value) {
        util.extendValues(this.res.locals, value);
      },
    },
  });

  // built-in connection
  scope._connection = (request, _extensions) => {
    const PID = `${process.pid}.${_pid}`;

    return $('Grown.Conn.Builder')({
      name: `Grown.Conn#${PID}`,
      props: {
        pid: () => PID,
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
              scope._extensions.push(bind.call(p, p.mixins));
            } else if (p.extensions) {
              p.extensions.forEach(x => {
                /* istanbul ignore else */
                if (x.mixins) {
                  scope._extensions.push(bind.call(p, x.mixins));
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
}

module.exports = (cwd, argv) => {
  const _argv = wargs(argv || process.argv.slice(2), {
    boolean: ['V', 'd', 'help'],
    alias: {
      V: 'verbose',
      d: 'debug',
      p: 'port',
      h: 'host',
      e: 'env',
    },
  });

  // private container
  const $ = function $(id, props, extensions) {
    return $new(id, props, $, extensions);
  };

  const Grown = $('Grown', grownFactory.bind(null, $));

  // defaults
  process.name = 'Grown (bare)';

  require('@grown/bare/environment')(_argv);
  require('@grown/bare/configure')($, cwd || process.cwd(), _argv, Grown);

  return Grown;
};
