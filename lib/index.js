'use strict';

/* eslint-disable global-require */

const debug = require('debug')('homegrown');

const pkg = require('../package.json');

const version = pkg.version;

// framework modules
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
  debug('Wait. Final handler reached');

  /* istanbul ignore else */
  if (!conn.halted) {
    debug('Trying to finalize the connection');

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

  debug('Trying to close all farms');

  FARMS.forEach((farm) => {
    Array.prototype.push.apply(_tasks, farm._finalizers);

    Object.keys(farm._hosts).forEach((host) => {
      _ends.push(() => farm._hosts[host].close());
    });
  });

  // reset
  const _length = FARMS.length;

  FARMS.splice(0, FARMS.length);

  return Promise.all(_tasks.map(cb => cb()))
    .then(() => Promise.all(_ends.map(cb => cb())))
    .then(() => {
      debug('%s farm%s %s flushed and removed',
        _length,
        _length === 1 ? '' : 's',
        _length === 1 ? 'was' : 'were');

      /* istanbul ignore else */
      if (typeof done === 'function') {
        done();
      }
    });
}

module.exports = $new('Homegrown', {
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

    return {
      methods: {
        // run connection
        dispatch: pipelineFactory('dispatch', this._pipeline, _dispatch),

        // shared extensions
        extensions: $new,

        // life-cycle hooks
        down(cb) {
          this._finalizers.push(cb);
        },

        up(cb) {
          this._initializers.push(cb);
        },
      },
    };
  },

  methods: {
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

  // built-in presets
  preset(name, defaults) {
    /* istanbul ignore else */
    if (typeof name === 'object') {
      defaults = name;
      name = 'default';
    }

    defaults = defaults || {};

    let $;

    try {
      $ = module.exports.new(defaults);

      debug('Trying to load built-in preset %s', name);

      require(`./preset/${name}`)($, defaults, _getPlugins());

      debug('Done. Preset %s was successfully initialized', name);
    } catch (e) {
      throw new Error(`Failure on '${name}' preset. ${e.message || e.toString()}`);
    }

    return $;
  },

  // global settings (?)
  configure: (_opts) => {
    debug('Trying to load configuration from .env');

    _env.config(_opts || { silent: true });
  },
});
