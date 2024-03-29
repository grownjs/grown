'use strict';

const debug = require('debug')('grown:server');
const proxyaddr = require('proxy-addr');

const _pkg = require('./package.json');

const _util = require('./lib/util');
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

function trustproxy() {
  const proto = this.req.connection.encrypted ? 'https' : 'http';
  const header = this.req.headers['x-forwarded-proto'] || this.req.protocol || proto;

  this.req.protocol = header.includes(',')
    ? header.split(',')[0].trim()
    : header.trim();

  this.req.host = this.req.headers['x-forwarded-host'] || this.req.host || this.req.headers.host;
  this.req.port = this.req.headers['x-forwarded-port'] || this.req.port;
  this.req.ips = proxyaddr.all(this.req, () => true);
  this.req.ip = proxyaddr(this.req, () => true);
}

function nocache() {
  this.res.setHeader('Cache-Control', 'private, no-cache, no-store, must-revalidate');
  this.res.setHeader('Expires', '-1');
  this.res.setHeader('Pragma', 'no-cache');
}

function https() {
  if (this.req.secure || process.env.NODE_ENV !== 'production') return;
  if (this.req.method === 'GET' || this.req.method === 'HEAD') {
    this.res.setHeader('Location', `https://${this.req.host + (this.req.originalUrl || this.req.url)}`);
    this.res.status(301).end();
  } else {
    this.res.status(403).end();
  }
  return true;
}

function cors() {
  this.res.setHeader('Access-Control-Allow-Credentials', 'true');
  this.res.setHeader('Access-Control-Allow-Origin', '*');
  this.res.setHeader('Access-Control-Allow-Headers', [
    'Authorization, X-API-KEY, Origin, X-Requested-With, X-Forwarded-Port, X-Forwarded-Proto',
    'Content-Type, Accept',
  ].join(', '));
  this.res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  this.res.setHeader('Allow', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

  /* istanbul ignore else */
  if (this.req.method === 'OPTIONS') {
    this.res.setHeader('Content-Length', '0');
    this.res.status(200).end();
    return true;
  }
}

function _grownFactory($, util, options) {
  debug('#%s Grown v%s - %s', process.pid, _pkg.version, $.Grown.env);

  options = { uws: false, ...options };

  const scope = {};

  scope._ = util;
  scope._hosts = {};
  scope._servers = {};

  scope._clients = [];
  scope._pipeline = [];
  scope._extensions = [];

  scope._events = util.buildPubsub();
  scope._options = util.buildSettings.call(scope, options);
  scope._callback = util.buildPipeline('^', scope._pipeline, util.doneCallback.bind(scope));

  // skip npm-cli keys
  const _environment = {};

  Object.keys(process.env).forEach(key => {
    /* istanbul ignore else */
    if (key.indexOf('npm_') === -1) {
      _environment[key] = process.env[key];
    }
  });

  $.Grown('Conn.Builder', {
    methods: {
      trustproxy,
      nocache,
      https,
      cors,

      tick(ms) {
        return new Promise(ok => setTimeout(ok, ms));
      },
      halt(cb) {
        /* istanbul ignore else */
        if (this.res) {
          /* istanbul ignore else */
          if (this.halted) {
            return Promise.resolve()
              .then(() => cb(this, scope._options))
              .catch(e => scope._events.emit('failure', e, scope._options));
          }

          this.res._halted = true;
        }
        return Promise.resolve()
          .then(() => scope._events.emit('before_send', null, this, scope._options))
          .then(() => typeof cb === 'function' && cb(this, scope._options))
          .catch(e => {
            scope._events.emit('failure', e, scope._options);

            /* istanbul ignore else */
            if (typeof cb === 'function') {
              return cb(e, this, scope._options);
            }
          });
      },
      raise(code, message) {
        this.res.setHeader('X-Failure', message);

        throw util.buildError(code || 500, message);
      },
      config(key, or) {
        return scope._options(key, or);
      },
    },
    props: {
      get is_finished() {
        return this.res.finished === true;
      },

      // read-only
      get halted() {
        /* istanbul ignore else */
        if (this.res) {
          return this.res._halted || (this.res._writableState && this.res._writableState.ended);
        }
        return this.has_body || this.has_status;
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
  scope._middleware = null;
  scope._connection = (request, _extensions) => {
    if (!scope._middleware || _extensions) {
      const PID = `${process.pid}.${_pid}`;

      scope._middleware = $.Grown('Conn.Builder')({
        name: `Grown.Conn#${PID}`,
        props: {
          env: () => _environment,
          cwd: () => $.Grown.cwd,
          pid: () => PID,
        },
        init() {
          _pid += 1;

          return [
            _extensions,
            scope._extensions,
          ];
        },
      });
    }

    return scope._middleware.new(request);
  };

  return {
    init() {
      util.mergeMethodsInto.call(this, this, scope._events);

      process.nextTick(() => {
        this.once('start', () => this.plug(options.plug));
        this.once('begin', () => this.emit('start'));
        this.once('listen', () => this.emit('ready'));

        if ($.Grown.env === 'development') {
          this.on('failure', e => {
            if (e.code !== 'ERR_STREAM_WRITE_AFTER_END') {
              console.error(`\r========= FAILURE =========\x1b[K\n${e.message}\n`);
              process.exit(1);
            }
          });
        }
      });

      _mount.call(scope, (req, res, next) => {
        if (options.cors && cors.call({ req, res })) return;
        if (options.cache === false) nocache.call({ req, res });
        if (options.trust === 'proxy') trustproxy.call({ req, res });
        if (options.https && https.call({ req, res })) return;
        next();
      });
    },
    methods: {
      run(request, callback) {
        return Promise.resolve()
          .then(() => this.emit('begin'))
          .then(() => {
            const conn = scope._connection(request || {});

            if (typeof conn.req.query === 'undefined') {
              conn.req.query = Object.fromEntries(new URLSearchParams(conn.req.url.split('?')[1] || ''));
            }

            return Promise.resolve()
              .then(() => this.emit('request', conn, scope._options))
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
          if (typeof p === 'function' && p.length >= 2 && !(p.extensions || p.$install || p.$mixins || p.class)) {
            debug('#%s Mount <%s>', process.pid, p.class || p.name);
            this.mount(p);
            return;
          }

          try {
            if (typeof p === 'function') {
              debug('#%s Install <%s>', process.pid, p.class || p.name);
            } else {
              debug('#%s Install <{ %s }>', process.pid, Object.keys(p).join(', '));
            }

            Object.keys(p).forEach(k => {
              if (k.indexOf('$before_') === 0) {
                this.on(k.substr(1), p[k].bind(p));
              }
            });

            if (p.$mixins) {
              scope._extensions.push(bind.call(p, p.$mixins));
            } else if (p.extensions) {
              p.extensions.forEach(x => {
                /* istanbul ignore else */
                if (x.$mixins) {
                  scope._extensions.push(bind.call(p, x.$mixins));
                }
              });
            }

            /* istanbul ignore else */
            if (typeof p.$install === 'function') {
              util.flattenArgs(p.$install.call(p, this, scope)).forEach(def => {
                /* istanbul ignore else */
                if (Object.prototype.toString.call(def) === '[object Object]') {
                  util.mergeDefinitionsInto.call(p, this, def);
                }
              });
            }
          } catch (e) {
            if (p.class || p.name) {
              throw new Error(`${p.class || p.name} definition failed\n${e.message}`);
            } else {
              throw new Error(`${e.message}\nGiven '{${Object.keys(p).join(', ')}}'`);
            }
          }
        });

        return this;
      },

      config: scope._options,

      close: () => scope.close(),

      clients: () => scope._clients,

      mount: (...args) => _mount.apply(scope, args),

      listen: (...args) => _listen.apply(scope, args),
    },
  };
}

module.exports = (Grown, util) => {
  const fixedUtils = _util(util);

  return Grown('Server', {
    create(options) {
      return _grownFactory({ Grown }, fixedUtils, options);
    },
  });
};
