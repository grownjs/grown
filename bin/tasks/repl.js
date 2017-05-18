'use strict';

/* eslint-disable global-require */

module.exports = ($, cwd) => {
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

  const _test = require('../../lib/plugs/testing.js');

  const _farm = require(path.join(cwd, $._[0] || 'app/server'));

  let farm;

  // small bootstrap
  function _startApplication() {
    _.echo(chalk.gray('↺ Initializing framework ...'), '\r\r');

    farm = _farm(cwd);

    farm.fetch = _test(farm);

    const _close = _repl($, cwd, farm);

    farm.on('close', () => _close());

    _.echo(chalk.gray('↺ Starting server ...'), '\r\r');

    farm.emit('start').then(() =>
      farm.listen('test://', app => {
        _.echo(chalk.green('✔ REPL is ready'), '\r\n');
        _.echo(chalk.gray('› Listening at '), chalk.yellow(app.location.href), '\n');
        _.echo(chalk.gray('› Type .help to list all available commands'), '\n');
      }));
  }

  _startApplication();

  process.on('repl:reload', () => _farm.teardown(_startApplication));
  process.on('SIGINT', () => _farm.teardown(() => process.exit()));
  process.on('exit', () => _.echo('\r', chalk.gray('› Stopped'), '\r\n'));
};
