import { version } from '../package.json';

/* eslint-disable global-require */

const useHook = require('./api/use');
const mountHook = require('./api/mount');
const listenHook = require('./api/listen');
const dispatchHook = require('./api/dispatch');
const configureHook = require('./api/configure');

const FARMS = [];

function _getPlugins() {
  const proxy = {};

  ['logger', 'models', 'render', 'router', 'session', 'test', 'upload']
    .forEach((name) => {
      Object.defineProperty(proxy, name, {
        get: () => require(`./plugs/${name}`),
      });
    });

  return proxy;
}

function _closeAll() {
  FARMS.forEach((farm) => {
    Object.keys(farm.hosts).forEach((host) => {
      farm.hosts[host].close();
    });
  });
}

// gracefully dies
process.on('exit', _closeAll);
process.on('SIGINT', () => process.exit());

const homegrown = module.exports = {
  version,

  new(defaults = {}) {
    const $ = {
      ctx: {},
      opts: {},

      hosts: {},
      servers: {},
      protocols: {},

      pipeline: [],
      extensions: {},
      initializers: [],
    };

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

  burn() {
    _closeAll();
  },

  farms(cb) {
    FARMS.forEach(cb);
  },

  // built-in plugins
  plugs: _getPlugins(),

  // built-in presets
  preset(name, defaults = {}) {
    if (typeof name === 'object') {
      defaults = name;
      name = 'default';
    }

    let $;

    try {
      $ = homegrown.new(defaults);

      const presetHook = require(`./preset/${name}`);

      presetHook($, { opts: defaults, plugs: _getPlugins() });
    } catch (e) {
      throw new Error(`Failure on '${name}' preset. ${e.message || e.toString()}`);
    }

    return $;
  },
};
