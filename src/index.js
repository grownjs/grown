/**
---
_bundle: true
---
*/

import { version } from '../package.json';

import useFactory from './_api/use';
import mountFactory from './_api/mount';
import listenFactory from './_api/listen';
import dispatchFactory from './_api/dispatch';
import configureFactory from './_api/configure';

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

    useFactory($);
    mountFactory($);
    listenFactory($);
    dispatchFactory($);
    configureFactory($);

    return $;
  },

  burn() {
    _closeAll();
  },

  farms(cb) {
    FARMS.forEach(cb);
  },
};
