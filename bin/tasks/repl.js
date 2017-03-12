'use strict';

/* eslint-disable global-require */

const CLR = '\x1b[K';

module.exports = $ => {
  const IS_DEBUG = $.flags.debug === true;

  /* istanbul ignore else */
  if (IS_DEBUG) {
    require('debug').enable('grown,grown:*');
  }

  require('source-map-support').install();

  const _ = require('../lib/util');
  const _repl = require('../lib/repl');

  const path = require('path');
  const chalk = require('chalk');

  const cwd = process.cwd();

  const _test = require('../../lib/plugs/testing.js');

  const _farm = require(path.join(cwd, 'app'));

  let farm;

  // small bootstrap
  function _startApplication() {
    _.echo(chalk.gray('↺ Initializing REPL ...'), '\r');

    farm = _farm();

    farm.fetch = _test(farm);

    const _close = _repl(farm);

    farm.on('close', () => _close());

    _.echo(chalk.green('✔ REPL is ready'), CLR, '\n');

    farm.listen('test://', (app) => {
      _.echo(chalk.gray('› Listening at '), chalk.yellow(app.location.href), '\n');
      _.echo(chalk.gray('› Type .fetch to start making requests'), '\n');
      _.echo(chalk.gray('› Type .reload to restart the current session'), '\n');
    });
  }

  _startApplication();

  function _reload() {
    return _farm.teardown(() => {
      _.clearModules();
      _startApplication();
    });
  }

  process.on('repl:reload', () => _reload());
  process.on('exit', () => _farm.teardown());
};
