'use strict';

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

const _util = require('../bin/lib/util');
const util = require('./util');

const FARMS = [];

// final handler
function _dispatch(err, conn) {
  debug('#%s OK. Final handler reached', conn.pid);

  /* istanbul ignore else */
  if (err) {
    return conn.end(err);
  }

  /* istanbul ignore else */
  if (!conn.has_body && conn.has_status(200)) {
    return conn.raise(501);
  }

  return conn.end()
    .then(() => debug('#%s Done.', conn.pid))
    .catch(e => debug('#%s %s', conn.pid, e));
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
    debug('%s farm%s %s removed',
      _length,
      _length === 1 ? '' : 's',
      _length === 1 ? 'was' : 'were');

    /* istanbul ignore else */
    if (typeof done === 'function') {
      done();
    }
  });
}

function Grown(opts) {
  // normalize
  opts = opts || {};

  // inner scope
  function $(id, props) {
    return $new(id, props, $);
  }

  /* istanbul ignore else */
  if (opts.env) {
    debug('Setting default environment: %s', opts.env);
  }

  return $({
    init() {
      debug('Instantiating a new farm');

      const events = {};

      function pubsub(e) {
        return events[e.toLowerCase()]
          || (events[e.toLowerCase()] = []);
      }

      FARMS.push(this);

      // private
      const $scope = {
        _ctx: this,
        _opts: {},
        _cache: {},

        _hosts: {},
        _servers: {},
        _protocols: {},

        _connection: [],
      };

      // built-in support
      $('Conn.https', () => require('https'));
      $('Conn.http', () => require('http'));
      $('Conn.uws', _uws);

      // settings
      $scope._opts = util.extend({}, opts);

      return {
        props: {
          env: () => $scope._opts.env || process.env.NODE_ENV || 'development',
          util: () => ({
            ents: util.ents,
            props: util.props,
            extend: util.extend,
            inspect: util.safeValue,
          }),
          logger: () => logger,
        },
        methods: {
          // start
          run(cb) {
            return this.emit('start')
              .then(() => cb && cb(this));
          },

          // plugins
          use(cb) {
            cb(this);

            return this;
          },

          // shared options
          get(key, defvalue) {
            const parts = (key || '').split('.');

            let value = util.extend({}, $scope._opts);
            let _key;

            for (let i = 0, c = parts.length; i < c; i += 1) {
              _key = parts[i];

              value = value ? value[_key] : undefined;

              /* istanbul ignore else */
              if (typeof value === 'undefined' && typeof defvalue === 'undefined') {
                throw new Error(`Missing config for: ${key}`);
              }
            }

            return typeof value !== 'undefined' ? value : defvalue;
          },

          // close all hosts
          stop(cb) {
            return this.emit('close').then(() =>
              Promise.all(Object.keys($scope._hosts)
                .map(host => $scope._hosts[host].close())))
              .then(() => _util.clearModules(this.get('cwd', process.cwd())))
              .then(() => cb && cb());
          },

          // hooks
          mount(name, cb) {
            _mount.call($scope, name, cb);

            return this;
          },

          // start the server
          listen(location, params, cb) {
            return _listen.call($scope, location, params, cb);
          },

          server: port => (port
            ? $scope._servers[port]
            : $scope._servers[Object.keys($scope._servers)[0]]),

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
            return pubsub(e).reduce((prev, cur) =>
              prev.then(() => cur.apply(null, args))
            , Promise.resolve())
            .then(() => this);
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
}, true);

// decorate with the testing harness
$new.readOnlyProperty(Grown, 'test', cb =>
  function $beforeTest(done) {
    cb.teardown(() => {
      this.server = cb();
      this.server.fetch = Grown.plugs.testing(this.server);

      return this.server.run(() =>
        Promise.resolve()
          .then(() => {
            Object.keys(this.server.extensions).forEach(key => {
              /* istanbul ignore else */
              if (typeof this[key] === 'undefined') {
                this[key] = this.server.extensions[key];
              }
            });
          })
          .then(() => this.server.listen('test://')))
        .then(() => done())
      .catch(done);
    });
  }, true);

$new.readOnlyProperty(Grown, 'burn', cb => _closeAll(cb), true);
$new.readOnlyProperty(Grown, 'farms', cb => FARMS.map(cb), true);

$new.readOnlyProperty(Grown, 'plugs', {
  static: require('./plugs/static'),
  access: require('./plugs/access'),
  models: require('./plugs/models'),
  render: require('./plugs/render'),
  router: require('./plugs/router'),
  mailer: require('./plugs/mailer'),
  session: require('./plugs/session'),
  socket: require('./plugs/socket'),
  testing: require('./plugs/testing'),
  container: require('./plugs/container'),
  formidable: require('./plugs/formidable'),
});

// nice logs!
$new.readOnlyProperty(Grown, 'logger', logger);
$new.readOnlyProperty(Grown, 'version', version);
