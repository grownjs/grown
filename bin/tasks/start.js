'use strict';

/* eslint-disable global-require */

const path = require('path');

module.exports = ($, cwd, logger) => {
  const IS_REPL = $.flags.repl;
  const IS_DEV = process.env.NODE_ENV === 'development';

  const PORT = $.flags.port || process.env.PORT || 8080;
  const HOST = $.flags.host || process.env.HOST || '0.0.0.0';

  /* istanbul ignore else */
  if (IS_DEV) {
    require('source-map-support').install();
  }

  // common helpers
  const _ = require('../lib/util');
  const _repl = require('../lib/repl');

  const _protocol = $.flags.uws !== true
    ? `http${$.flags.https === true ? 's' : ''}`
    : 'uws';

  /* istanbul ignore else */
  if (!$._[0]) {
    throw new Error('Missing application script (add --help for usage info)');
  }

  const _test = require('../../lib/plugs/testing.js');
  const _farm = require(path.join(cwd, $._[0]));

  // initialization
  let farm;

  function _startApplication(done) {
    logger('Initializing framework', () => {
      try {
        farm = _farm();
      } catch (e) {
        _.printError(e, $.flags, logger);
        _.die(1);
      }

      /* istanbul ignore else */
      if (IS_REPL) {
        farm.fetch = _test(farm);

        const _close = _repl($, farm);

        farm.on('close', () => _close());
        farm.on('reload', () => _close());
        farm.on('reload', () => _farm.teardown(_startApplication));
      }
    });

    logger('Starting server', () => {
      farm.run(() =>
        farm.listen(`${_protocol}://${HOST}:${PORT}`, app => {
          logger.info('{% ok Server is ready %}\n');
          logger.info('{% link %s %}\n', app.location.href);

          /* istanbul ignore else */
          if (IS_REPL) {
            logger.info('{% log Type %} {% bold .help %} {% gray to list all available commands %}\n');
          }

          /* istanbul ignore else */
          if (typeof done === 'function') {
            done(farm, app);
          }
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
