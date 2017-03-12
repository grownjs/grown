'use strict';

/* eslint-disable global-require */

const CLR = '\x1b[K';

module.exports = $ => {
  const IS_DEBUG = $.flags.debug === true;
  const IS_REPL = $.flags.repl === true;
  const IS_DEV = process.env.NODE_ENV === 'dev';

  /* istanbul ignore else */
  if (IS_DEBUG) {
    require('debug').enable('grown,grown:*');
  }

  /* istanbul ignore else */
  if (IS_DEV) {
    require('source-map-support').install();
  }

  // common helpers
  const _ = require('../lib/util');
  const _repl = require('../lib/repl');

  const cwd = process.cwd();

  const path = require('path');
  const chalk = require('chalk');
  const cleanStack = require('clean-stack');

  const _test = require('../../lib/plugs/testing.js');

  const _farm = require(path.join(cwd, 'app'));

  // initialization
  let farm;

  function _startServer(done) {
    _.echo(chalk.gray('↺ 2/2 Starting server...'), CLR, '\r');

    // start server
    farm.listen(`http://0.0.0.0:${process.env.PORT || 8080}`, (app) => {
      _.echo(chalk.gray('— Listening at '), chalk.yellow(app.location.href), '\n');

      if (IS_REPL) {
        _.echo(chalk.gray('— Type .help to show all available commands'), '\n');
      }

      /* istanbul ignore else */
      if (typeof done === 'function') {
        done(farm, app);
      }
    });
  }

  function _startApplication(done) {
    try {
      farm = _farm();

      if (IS_REPL) {
        farm.fetch = _test(farm);

        const _close = _repl(farm);

        farm.on('close', () => _close());
      }

      _startServer(done);
    } catch (e) {
      _.echo(chalk.red((IS_DEBUG && cleanStack(e.stack)) || e.message), '\n');
      _.die(1);
    }
  }

  _.echo(chalk.gray('↺ 1/2 Initializing server...'), CLR, '\r');

  _startApplication();

  function _reload() {
    return _farm.teardown(() => {
      _.clearModules();
      _startApplication();
    });
  }

  if (IS_REPL) {
    process.on('repl:reload', () => _reload());
  } else {
    process.on('exit', () => _farm.teardown());
    process.on('SIGINT', () => process.exit());
  }
};
