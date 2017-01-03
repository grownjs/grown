var version = "0.1.0";

var Homegrown = require('./lib/api');

var FARMS = [];

function _closeAll() {
  FARMS.forEach(function (farm) {
    Object.keys(farm.hosts).forEach(function (host) {
      farm.hosts[host].close();
    });
  });
}

// gracefully dies
process.on('exit', _closeAll);
process.on('SIGINT', function () { return process.exit(); });

var index = {
  version: version,

  new: function new$1(defaults) {
    if ( defaults === void 0 ) defaults = {};

    var $ = {
      ctx: {},
      opts: {},

      hosts: {},
      servers: {},
      protocols: {},

      pipeline: [],
      extensions: {},
      initializers: [],
    };

    Object.keys(defaults).forEach(function (key) {
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

  burn: function burn() {
    _closeAll();
  },

  farms: function farms(cb) {
    FARMS.forEach(cb);
  },
};

module.exports = index;
