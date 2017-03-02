'use strict';

/* eslint-disable global-require */
/* eslint-disable prefer-spread */
/* eslint-disable prefer-rest-params */
/* eslint-disable prefer-arrow-callback */

const debug = require('debug')('homegrown');

const pkg = require('../package.json');

const version = pkg.version;

const _slice = Array.prototype.slice;

// framework modules
const path = require('path');
const _env = require('dotenv');
const $new = require('object-new');

// built-in methods
const _mount = require('./api/mount');
const _listen = require('./api/listen');

const util = require('./util');
const pipelineFactory = require('./pipeline');

const FARMS = [];

// final handler
function _dispatch(err, conn) {
  debug('OK. Final handler reached');

  /* istanbul ignore else */
  if (!conn.halted) {
    debug('Wait. Trying to finalize the connection');

    /* istanbul ignore else */
    if (err) {
      throw err;
    }

    /* istanbul ignore else */
    if (!conn.is_finished && conn.has_status(200)) {
      throw util.statusErr(501);
    }

    return conn.end();
  }
}

function _getPlugins() {
  const proxy = {};

  ['logger', 'models', 'render', 'router', 'session', 'upload', 'socket']
    .forEach((name) => {
      Object.defineProperty(proxy, name, {
        configurable: false,
        enumerable: true,
        get() {
          return require(`./plugs/${name}`);
        },
      });
    });

  return proxy;
}

function _closeAll(done) {
  const _tasks = [];

  debug('Closing all farms');

  FARMS.forEach((farm) => {
    _tasks.push(() => farm.close());
  });

  // reset
  const _length = FARMS.length;

  FARMS.splice(0, _length);

  // execute
  _tasks.map(cb => cb());

  debug('%s farm%s %s removed',
    _length,
    _length === 1 ? '' : 's',
    _length === 1 ? 'was' : 'were');

  /* istanbul ignore else */
  if (typeof done === 'function') {
    done();
  }
}

function Grown(opts) {
  // inner scope
  function $(id, props) {
    return $new(id, props, $);
  }

  return $('Grown', {
    init(defaults) {
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

        _hosts: {},
        _servers: {},
        _protocols: {},

        _connection: [],
      };

      // built-in support
      $('Grown.conn.https', () => require('https'));
      $('Grown.conn.http', () => require('http'));
      $('Grown.conn.uws', require('./_uws'));

      // settings
      $scope._opts = util.extend({}, defaults);

      // shortcuts
      (defaults.use || []).forEach(cb => cb(this, util));
      (defaults.mount || []).forEach((name, cb) => _mount.call($scope, name, cb));

      return {
        methods: {
          // plugins
          use(cb) {
            cb(this, util);

            return this;
          },

          // shared options
          get(key, defvalue) {
            const parts = (key || '').split('.');

            let value = util.extend({}, $scope._opts);

            while (parts.length) {
              value = value ? value[parts.shift()] : undefined;
            }

            return typeof value !== 'undefined' ? value : defvalue;
          },

          // close all hosts
          close() {
            return this.emit('close').then(() => {
              Object.keys($scope._hosts).forEach((host) => {
                $scope._hosts[host].close();
              });
            });
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
            return Promise.all(pubsub(e).map(cb =>
              cb.apply(null, _slice.call(arguments, 1))));
          },
        },
      };
    },
  }).new(opts || {});
}

// factory
module.exports = Grown;
module.exports.new = opts => new Grown(opts);

$new.readOnlyProperty(Grown, 'env', (cwd, encoding) => {
  cwd = cwd || process.cwd();

  debug('Loading .env settings from %s', cwd);

  _env.config({ path: path.join(cwd, '.env'), encoding });
}, true);

$new.readOnlyProperty(Grown, 'burn', cb => _closeAll(cb), true);
$new.readOnlyProperty(Grown, 'farms', cb => FARMS.map(cb), true);

$new.readOnlyProperty(Grown, 'plugs', _getPlugins());
$new.readOnlyProperty(Grown, 'version', version);
