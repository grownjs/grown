'use strict';

/* eslint-disable global-require */
/* eslint-disable prefer-spread */
/* eslint-disable prefer-rest-params */

const debug = require('debug')('homegrown');

const pkg = require('../package.json');

const version = pkg.version;

const _push = Array.prototype.push;
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
    if (conn.resp_body === null && conn.res.statusCode === 200) {
      conn.put_status(501);
    }

    /* istanbul ignore else */
    if (err) {
      throw err;
    }

    return conn.end();
  }
}

function _getPlugins() {
  const proxy = {};

  ['test', 'repl', 'logger', 'models', 'render', 'router', 'session', 'upload']
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
  const _ends = [];

  debug('Closing all farms');

  FARMS.forEach((farm) => {
    _push.apply(_tasks, () => farm.emit('close'));

    Object.keys(farm._hosts).forEach((host) => {
      _ends.push(() => farm._hosts[host].close());
    });
  });

  // reset
  const _length = FARMS.length;

  _tasks.map(cb => cb());
  _ends.map(cb => cb());

  FARMS.splice(0, FARMS.length);

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
    version,

    // built-in plugins
    plugs: _getPlugins(),

    props: {
      _opts: {},

      _hosts: {},
      _servers: {},
      _protocols: {},

      _pipeline: [],
      _finalizers: [],
      _initializers: [],
    },

    init(defaults) {
      debug('Instantiating a new farm');

      util.extend(this._opts, defaults || {});

      FARMS.push(this);

      const _events = {};

      function pubsub(e) {
        return _events[e.toLowerCase()]
          || (_events[e.toLowerCase()] = []);
      }

      return {
        methods: {
          // run connection
          dispatch: pipelineFactory('dispatch', this._pipeline, _dispatch),

          // shared extensions
          extensions: $,

          // events support
          on(e, cb) {
            pubsub(e).push(cb);
          },

          emit(e) {
            return pubsub(e).map(cb => cb.apply(null, _slice.call(arguments, 1)));
          },
        },
      };
    },

    methods: {
      get(key, defvalue) {
        const parts = (key || '').split('.');

        let value = this._opts;

        while (parts.length) {
          value = value ? value[parts.shift()] : undefined;
        }

        return typeof value !== 'undefined' ? value : defvalue;
      },

      use(cb) {
        return cb(this, util);
      },

      burn(cb) {
        return _closeAll(cb);
      },

      farms(cb) {
        return this._farms.map(cb);
      },

      mount(name, cb) {
        return _mount.call(this, name, cb);
      },

      listen(location, opts, cb) {
        return _listen.call(this, location, opts, cb);
      },
    },

    // global settings (?)
    configure: (cwd, encoding) => {
      cwd = cwd || process.cwd();

      debug('Loading .env settings from %s', cwd);

      _env.config({ path: path.join(cwd, '.env'), encoding });
    },
  });
};
