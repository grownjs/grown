'use strict';

require('global-or-local').install([
  'ava',
  'babel',
  'babel-plugin-transform-react-jsx',
  'babel-preset-es2015',
  'body-parser',
  'browser-sync',
  'buble',
  'chai',
  'chokidar',
  'codecov',
  'cookie-parser',
  'cookie-session',
  'connect-flash',
  'cron',
  'csso',
  'csurf',
  'eslint',
  'eslint-config-airbnb-base',
  'eslint-plugin-import',
  'formidable',
  'fusebox',
  'google-closure-compiler-js',
  'grown',
  'jasmine-node',
  'less',
  'less-plugin-autoprefix',
  'live-reload',
  'mocha',
  'mssql',
  'mysql',
  'node-notifier',
  'nyc',
  'pg',
  'pg-native',
  'postcss',
  'postcss-cssnext',
  'postcss-import',
  'rollup',
  'rollup-plugin-commonjs',
  'rollup-plugin-node-resolve',
  'route-mappings',
  'sass',
  'serve-static',
  'sqlite3',
  'styl',
  'superscript',
  'talavera',
  'tarima',
  'tarima-bower',
  'tarima-browser-sync',
  'tarima-lr',
  'traceur',
  'webpack',
]);

const debug = require('debug')('grown');

const pkg = require('../package.json');

const version = pkg.version;

const _slice = Array.prototype.slice;

// framework modules
const path = require('path');
const _env = require('dotenv');
const $new = require('object-new');
const logger = require('log-pose');

// built-in methods
const _uws = require('./conn/_uws');

const _mount = require('./api/mount');
const _listen = require('./api/listen');

const pipelineFactory = require('./util/pipeline');

const util = require('./util');
const helpers = require('./util/helpers');

const FARMS = [];

// final handler
function _dispatch(err, conn) {
  debug('#%s OK. Final handler reached', conn.pid);

  // FIXME: run before_send() here?

  return Promise.resolve()
    .then(() => {
      /* istanbul ignore else */
      if (err) {
        throw err;
      }

      return conn.end();
    })
    .then(() => debug('#%s Finished.', conn.pid))
    .catch(e => conn.end(e));
}

function _closeAll(done) {
  const _tasks = [];

  debug('Closing all farms');

  FARMS.forEach(farm => {
    _tasks.push(() => {
      farm.stop();
    });
  });

  // reset
  const _length = FARMS.length;

  FARMS.splice(0, _length);

  // execute
  Promise.all(_tasks.map(cb => cb())).then(() => {
    debug('%s farm%s %s removed', _length, _length === 1 ? '' : 's', _length === 1 ? 'was' : 'were');

    /* istanbul ignore else */
    if (typeof done === 'function') {
      done();
    }
  });
}

function Grown(opts) {
  // inner scope
  function $(id, props, extensions) {
    /* istanbul ignore else */
    if (props === false) {
      extensions = false;
      props = null;
    }

    return $new(id, props, $, extensions);
  }

  /* istanbul ignore else */
  if (!(opts && opts.env && opts.cwd)) {
    throw new Error('Missing environment config');
  }

  return $({
    init() {
      debug('Instantiating a new farm');

      const events = {};

      function pubsub(e) {
        /* istanbul ignore else */
        if (!events[e.toLowerCase()]) {
          events[e.toLowerCase()] = [];
        }

        return events[e.toLowerCase()];
      }

      FARMS.push(this);

      // clone options
      const _opts = util.extend({}, opts);

      function _getConfig(key, defvalue) {
        let value;

        try {
          value = util.get(_opts, key, defvalue);
        } catch (e) {
          throw new Error(`Cannot resolve config: ${key}`);
        }

        return typeof value !== 'undefined' ? value : defvalue;
      }

      // private
      const $scope = {
        _ctx: this,
        _data: {},

        _hosts: {},
        _servers: {},
        _protocols: {},

        _connection: [],
      };

      // built-in support
      $('Conn.https', () => require('https'));
      $('Conn.http', () => require('http'));
      $('Conn.uws', _uws);

      // FIXME: clean API...
      const _utils = util.extend({}, util, helpers(_opts, _getConfig));

      // shared utils
      const _ = {
        // helpers
        logger: () => logger,
        util: () => _utils,

        // environment
        cwd: () => _opts.cwd,
        env: () => _opts.env,
      };

      // shared context
      $('Conn')._ = $({
        props: _,
        methods: {
          options: _getConfig,
        },
      });

      return {
        props: _,
        methods: {
          // start
          run(cb) {
            return this.emit('start', $('Conn._'))
              .then(() => cb && cb($('Conn._')));
          },

          // plugins
          use(cb) {
            if (Array.isArray(cb)) {
              cb.forEach(x => x(this));
            } else {
              cb(this);
            }

            return this;
          },

          // close all hosts
          stop(cb) {
            return this.emit('close', $('Conn._')).then(() =>
              Promise.all(Object.keys($scope._hosts)
                .map(host => $scope._hosts[host].close())))
              .then(() => util.clearModules(_opts.cwd))
              .then(() => cb && cb($('Conn._')));
          },

          // hooks
          mount(name, def, cb) {
            _mount.call($scope, name, def, cb);

            return this;
          },

          // start the server
          listen(location, params, cb) {
            return _listen.call($scope, location, params, cb);
          },

          server: port => (port
            ? $scope._servers[port]
            : $scope._servers[Object.keys($scope._servers)[0]]),

          // shared options
          options: _getConfig,

          // run connection
          dispatch: pipelineFactory('dispatch', $scope._connection, _dispatch),

          // shared extensions
          extensions: $,

          // events support
          on(e, cb) {
            pubsub(e).push(cb);

            return this;
          },

          off(e, cb) {
            const p = pubsub(e);
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
                pubsub(e).splice(k, 1);
              }
            }

            k = pubsub(e).push($once) - 1;

            return this;
          },

          emit(e) {
            const args = _slice.call(arguments, 1);

            // run tasks in sequence
            return pubsub(e).reduce((prev, cur) => prev.then(() => cur.apply(null, args)), Promise.resolve()).then(() => this);
          },
        },
      };
    },
  });
}

// factory
module.exports = Grown;
module.exports.new = opts => new Grown(opts);

$new.readOnlyProperty(Grown, 'env', (cwd, encoding) => {
  cwd = cwd || process.cwd();

  debug('Loading .env settings from %s', cwd);

  _env.config({ path: path.join(cwd, '.env'), encoding });
});

// decorate with the testing harness
$new.readOnlyProperty(Grown, 'test', cb =>
  function $beforeTest(done) {
    cb.teardown(() => {
      this.server = cb();
      this.server.fetch = Grown.plugs.testing(this.server);

      return this.server.run(() =>
        Promise.resolve()
          .then(() => util.extend(this, this.server.extensions('Conn._')))
          .then(() => this.server.listen('test://')))
        .then(() => done())
        .catch(done);
    });
  });

$new.readOnlyProperty(Grown, 'burn', cb => _closeAll(cb));
$new.readOnlyProperty(Grown, 'farms', cb => FARMS.map(cb));

// lazy-loading
const _plugins = {};

$new.mergePropertiesInto(_plugins, {
  tarima: () => require('./plugs/tarima'),
  static: () => require('./plugs/static'),
  access: () => require('./plugs/access'),
  models: () => require('./plugs/models'),
  render: () => require('./plugs/render'),
  router: () => require('./plugs/router'),
  mailer: () => require('./plugs/mailer'),
  socket: () => require('./plugs/socket'),
  session: () => require('./plugs/session'),
  testing: () => require('./plugs/testing'),
  cronjobs: () => require('./plugs/cronjobs'),
  container: () => require('./plugs/container'),
  formidable: () => require('./plugs/formidable'),
  superscript: () => require('./plugs/superscript'),
});

$new.readOnlyProperty(Grown, 'plugs', _plugins);

// nice logs!
$new.readOnlyProperty(Grown, 'logger', logger);
$new.readOnlyProperty(Grown, 'version', version);
