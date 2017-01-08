import { version } from '../package.json';

/* eslint-disable global-require */
const path = require('path');

const CACHE = {};
const LIBDIR = path.resolve(__dirname, '..');

require('source-map-support').install({
  retrieveSourceMap(source) {
    if (CACHE[source]) {
      return CACHE[source];
    }

    return null;
  },
});

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

module.exports = {
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

  // source-maps support
  sources(cwd, _cache) {
    Object.keys(_cache).forEach((key) => {
      /* istanbul ignore else */
      if (_cache[key].map) {
        _cache[key].map.sources =
        _cache[key].map.sources.map((src) => {
          /* istanbul ignore else */
          if (src.charAt() === '/') {
            return src;
          }

          return path.join(cwd, src);
        });

        CACHE[path.join(cwd, _cache[key].dest)] = {
          map: _cache[key].map,
          url: path.join(cwd, key),
        };
      }
    });
  },
};

/* eslint-disable import/no-unresolved */
module.exports.sources(LIBDIR, require('./index.json'));
