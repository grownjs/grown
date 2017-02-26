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

module.exports = () => {
  // inner scope
  function $(id, props) {
    return $new(id, props, $);
  }

  return $('Homegrown', {
    init(defaults) {
      debug('Instantiating a new farm');

      const events = {};

      function pubsub(e) {
        return events[e.toLowerCase()]
          || (events[e.toLowerCase()] = []);
      }

      const options = util.extend({}, defaults || {});

      FARMS.push(this);

      // private
      const $scope = {
        _ctx: this,
        _opts: options,

        _hosts: {},
        _servers: {},
        _protocols: {},

        _connection: [],
      };

      // built-in support
      $('Homegrown.conn.https', () => require('https'));
      $('Homegrown.conn.http', () => require('http'));
      $('Homegrown.conn.uws', require('./_uws'));

      return {
        methods: {
          // plugins
          use(cb) {
            cb(this, util);
          },

          // shared options
          get(key, defvalue) {
            const parts = (key || '').split('.');

            let value = util.extend({}, options);

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
          },

          off(e, cb) {
            const p = pubsub(e);
            const q = p.indexOf(cb);

            /* istanbul ignore else */
            if (q > -1) {
              p.splice(q, 1);
            }
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
          },

          emit(e) {
            return Promise.all(pubsub(e).map(cb =>
              cb.apply(null, _slice.call(arguments, 1))));
          },
        },
      };
    },
  });
};

$new.readOnlyProperty(module.exports, 'env', (cwd, encoding) => {
  cwd = cwd || process.cwd();

  debug('Loading .env settings from %s', cwd);

  _env.config({ path: path.join(cwd, '.env'), encoding });
}, true);

$new.readOnlyProperty(module.exports, 'burn', cb => _closeAll(cb), true);
$new.readOnlyProperty(module.exports, 'farms', cb => FARMS.map(cb), true);

$new.readOnlyProperty(module.exports, 'plugs', _getPlugins());
$new.readOnlyProperty(module.exports, 'version', version);
