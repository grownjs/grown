'use strict';

/* eslint-disable global-require */

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

// final handler
function _dispatch(err, conn) {
  /* istanbul ignore else */
  if (!conn.halted) {
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

function _closeAll(farms, done) {
  const _tasks = [];
  const _ends = [];

  farms.forEach((farm) => {
    Array.prototype.push.apply(_tasks, farm.finalizers);

    Object.keys(farm.hosts).forEach((host) => {
      _ends.push(() => farm.hosts[host].close());
    });
  });

  return Promise.all(_tasks.map(cb => cb()))
    .then(() => Promise.all(_ends.map(cb => cb())))
    .then(() => {
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
    // ins
    _farms: [],

    _ctx: {},
    _opts: {},

    _hosts: {},
    _servers: {},
    _protocols: {},

    _pipeline: [],
    _finalizers: [],
    _initializers: [],
  },

  init(defaults) {
    util.extend(this._opts, defaults || {});

    return {
      methods: {
        // run connection
        dispatch: pipelineFactory('_dispatch', this._pipeline, _dispatch),

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
      return _closeAll(this._farms.splice(0, this._farms.length), cb);
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

      require(`./preset/${name}`)($, defaults, _getPlugins());
    } catch (e) {
      throw new Error(`Failure on '${name}' preset. ${e.message || e.toString()}`);
    }

    return $;
  },

  // global settings (?)
  configure: _opts => _env.config(_opts || { silent: true }),
});
