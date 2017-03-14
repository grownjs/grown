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

  const _protocol = $.flags.uws === true ? 'uws' : `http${$.flags.https === true ? 's' : ''}`;

  const _test = require('../../lib/plugs/testing.js');

  const _farm = require(path.join(cwd, $._[0] || 'app/server'));

  // initialization
  let farm;

  function _startApplication(done) {
    try {
      _.echo(chalk.gray('↺ Initializing server ...'), '\r');

      farm = _farm();

      if (IS_REPL) {
        farm.fetch = _test(farm);

        const _close = _repl(farm);

        farm.on('close', () => _close());
      }

      _.echo(chalk.green('✔ Server is ready'), CLR, '\n');

      // start server
      farm.listen(`${_protocol}://0.0.0.0:${process.env.PORT || 8080}`, (app) => {
        _.echo(chalk.gray('› Listening at '), chalk.yellow(app.location.href), '\n');

        if (IS_REPL) {
          _.echo(chalk.gray('› Type .fetch to start making requests'), '\n');
          _.echo(chalk.gray('› Type .reload to restart the current session'), '\n');
        }

        /* istanbul ignore else */
        if (typeof done === 'function') {
          done(farm, app);
        }
      });
    } catch (e) {
      _.echo(chalk.red((IS_DEBUG && cleanStack(e.stack)) || e.message), '\n');
      _.die(1);
    }
  }

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
