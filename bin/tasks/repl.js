'use strict';

/* eslint-disable global-require */

const _ = require('../lib/util');

const path = require('path');

module.exports = ($, cwd, logger) => {
  require('source-map-support').install();

  // const _ = require('../lib/util');
  const _repl = require('../lib/repl');
  const _test = require('../../lib/plugs/testing.js');
  const _farm = require(path.join(cwd, 'app/server'));

  let farm;

  // small bootstrap
  function _startApplication() {
    logger('Initializing framework', () => {
      try {
        farm = _farm();
      } catch (e) {
        _.printError(e, $.flags, logger);
        _.die(1);
      }

      farm.fetch = _test(farm);

      const _close = _repl($, farm);

      farm.on('close', () => _close());
      farm.on('reload', () => _close());
      farm.on('reload', () => _farm.teardown(_startApplication));
    });

    logger('Starting server', () => {
      farm.run(() =>
        farm.listen('test://', () => {
          logger.info('{% ok REPL is ready %}\n');
          logger.info('{% log Type %} {% bold .help %} {% gray to list all available commands %}\n');
        }))
        .catch(e => {
          _.printError(e, $.flags, logger);
          _.die(1);
        });
    });
  }

  _startApplication();

  process.on('SIGINT', () => _farm.teardown(() => process.exit()));
};
