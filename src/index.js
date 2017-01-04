import { version } from '../package.json';

const Homegrown = require('./api');

const FARMS = [];

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

export default {
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

    Homegrown.bind.use($);
    Homegrown.bind.mount($);
    Homegrown.bind.listen($);
    Homegrown.bind.dispatch($);
    Homegrown.bind.configure($);

    return $;
  },

  burn() {
    _closeAll();
  },

  farms(cb) {
    FARMS.forEach(cb);
  },
};
