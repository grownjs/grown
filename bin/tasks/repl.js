'use strict';

/* eslint-disable global-require */

const util = require('../../lib/util');

const path = require('path');

module.exports = ($, cwd, logger) => {
  require('source-map-support').install();

  const _repl = require('../lib/repl');
  const _test = require('../../lib/plugs/testing.js');
  const _farm = require(path.resolve(cwd, $.flags.app));

  process.on('SIGINT', () =>
    _farm.teardown(() => process.exit()));

  function _startApplication() {
    let _app;
    let _closing;

    function close(cb) {
      _closing = true;

      return _app.stop(() => {
        _closing = false;
        cb();
      });
    }

    logger('Initializing framework', () => {
      try {
        _app = _farm();
        _app.fetch = _test(_app);

        const _close = _repl($, _app);

        _app.on('reload', () => {
          _close();

          if (!_closing) {
            close(() => setTimeout(_startApplication, 100));
          }
        });
      } catch (e) {
        util.printError(e, $.flags, logger);
        util.die(1);
      }
    });

    logger('Starting server', () => {
      _app.run(() =>
        _app.listen('test://').then(() => {
          logger.info('{% ok REPL is ready %}\n');
          logger.info('{% log Type %} {% bold .help %} {% gray to list all available commands %}\n');
        }))
        .catch(e => {
          util.printError(e, $.flags, logger);
          util.die(1);
        });
    });

    return close;
  }

  _startApplication();
};
