'use strict';

/* eslint-disable global-require */

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
      farm = _farm();
      farm.fetch = _test(farm);

      const _close = _repl($, farm);

      farm.on('close', () => _close());
    });

    logger('Starting server', () => {
      farm.run(() =>
        farm.listen('test://', () => {
          logger.info('{% ok REPL is ready %} {% gray (v%s) %}\n', _farm.version);
          logger.info('{% log Type %} {% bold .help %} {% gray to list all available commands %}\n');
        }));
    });

    farm.on('reload', () => _farm.teardown(_startApplication));
  }

  _startApplication();

  process.on('SIGINT', () => _farm.teardown(() => process.exit()));
};
