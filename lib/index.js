'use strict';

const pkg = require('../package.json');

const version = pkg.version;

/* eslint-disable global-require */

const useHook = require('./api/use');
const mountHook = require('./api/mount');
const listenHook = require('./api/listen');
const dispatchHook = require('./api/dispatch');
const configureHook = require('./api/configure');

const FARMS = [];

function _getPlugins() {
  const proxy = {};

  ['test', 'repl', 'logger', 'models', 'render', 'router', 'session', 'upload']
    .forEach((name) => {
      Object.defineProperty(proxy, name, {
        get: () => require(`./plugs/${name}`),
      });
    });

  return proxy;
}

function _closeAll(done) {
  const _tasks = [];
  const _ends = [];

  FARMS.forEach((farm) => {
    Array.prototype.push.apply(_tasks, farm.finalizers);

    Object.keys(farm.hosts).forEach((host) => {
      _ends.push(() => farm.hosts[host].close());
    });
  });

  FARMS.splice(0, FARMS.length);

  return Promise.all(_tasks.map(cb => cb()))
    .then(() => Promise.all(_ends.map(cb => cb())))
    .then(() => {
      /* istanbul ignore else */
      if (typeof done === 'function') {
        done();
      }
    });
}

module.exports = {
  version,

  new(defaults) {
    const $ = {
      ctx: {},
      opts: {},

      hosts: {},
      servers: {},
      protocols: {},

      pipeline: [],
      extensions: {},

      finalizers: [],
      initializers: [],
    };

    defaults = defaults || {};

    Object.keys(defaults).forEach((key) => {
      $.opts[key] = defaults[key];
    });

    FARMS.push($);

    useHook($);
    mountHook($);
    listenHook($);
    dispatchHook($);
    configureHook($);

    return $;
  },

  burn(cb) {
    return _closeAll(cb);
  },

  farms(cb) {
    FARMS.forEach(cb);
  },

  // built-in plugins
  plugs: _getPlugins(),

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
};
