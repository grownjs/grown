'use strict';

/* eslint-disable global-require */

const path = require('path');

module.exports = ($, cwd, logger) => {
  const IS_REPL = $.flags.repl;
  const IS_DEV = process.env.NODE_ENV === 'development';

  const PORT = $.flags.port || process.env.PORT || '8080';
  const HOST = $.flags.host || process.env.HOST || '0.0.0.0';

  /* istanbul ignore else */
  if (IS_DEV) {
    require('source-map-support').install();
  }

  // common helpers
  const _ = require('../../lib/util');
  const _repl = require('../lib/repl');

  const _protocol = $.flags.uws !== true
    ? `http${$.flags.https === true ? 's' : ''}`
    : 'uws';

  const _test = require('../../lib/plugs/testing.js');
  const _farm = require(path.resolve(cwd, $.flags.app));

  // initialization

  function _startApplication(done) {
    let app;

    logger('Initializing framework', () => {
      try {
        app = _farm();
      } catch (e) {
        _.printError(e, $.flags, logger);
        _.die(1);
      }

      /* istanbul ignore else */
      if (IS_REPL) {
        app.fetch = _test(app);

        const _close = _repl($, app);

        app.on('close', () => _close());
        app.on('reload', () => {
          _close();

          // delay restart
          _farm.teardown(() => {
            setTimeout(_startApplication, 100);
          });
        });
      }
    });

    logger('Starting server', () => {
      app.run(() =>
        app.listen(`${_protocol}://${HOST}:${PORT}`).then(ctx => {
          logger.info('{% ok Ready: %} {% cyan %s %}\n', ctx.location.href);

          /* istanbul ignore else */
          if (IS_REPL) {
            logger.info('{% log Type %} {% bold .help %} {% gray to list all available commands %}\n');
          }

          /* istanbul ignore else */
          if (typeof done === 'function') {
            done(app, ctx);
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
