'use strict';

/* eslint-disable global-require */

const util = require('../../lib/util');

const path = require('path');

module.exports = ($, cwd, logger) => {
  require('source-map-support').install();

  const _repl = require('../lib/repl');
  const _test = require('../../lib/plugs/testing.js');
  const _farm = require(path.resolve(cwd, $.flags.app));

  let farm;

  // small bootstrap
  function _startApplication() {
    logger('Initializing framework', () => {
      try {
        farm = _farm();
      } catch (e) {
        util.printError(e, $.flags, logger);
        util.die(1);
      }

      farm.fetch = _test(farm);
      farm.testing = true;

      const _close = _repl($, farm);

      farm.on('close', () => _close());
      farm.on('reload', () => _close());
      farm.on('reload', () => _farm.teardown(_startApplication));
    });

    logger('Starting server', () => {
      farm.run(() =>
        farm.listen('test://').then(() => {
          logger.info('{% ok REPL is ready %}\n');
          logger.info('{% log Type %} {% bold .help %} {% gray to list all available commands %}\n');
        }))
        .catch(e => {
          util.printError(e, $.flags, logger);
          util.die(1);
        });
    });
  }

  _startApplication();

  process.on('SIGINT', () => _farm.teardown(() => process.exit()));
};
