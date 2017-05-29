'use strict';

/* eslint-disable global-require */

module.exports = ($, cwd) => {
  require('source-map-support').install();

  // const _ = require('../lib/util');
  const _repl = require('../lib/repl');

  const path = require('path');
  // const chalk = require('chalk');

  const _test = require('../../lib/plugs/testing.js');

  const _farm = require(path.join(cwd, 'app/server'));

  let farm;

  // small bootstrap
  function _startApplication() {
    // _.echo(chalk.gray('↺ Initializing framework ...'), '\r\r');

    farm = _farm();

    farm.fetch = _test(farm);

    const _close = _repl($, farm);

    farm.on('close', () => _close());

    // _.echo(chalk.gray('↺ Starting server ...'), '\r\r');

    farm.run(() =>
      farm.listen('test://', app => {
        // _.echo(chalk.green('✔ REPL is ready'), ' ', chalk.gray(`(v${_farm.version})`), '\r\n');
        // _.echo(chalk.gray('› Listening at '), chalk.yellow(app.location.href), '\n');
        // _.echo(chalk.gray('› Type .help to list all available commands'), '\n');
      }));

    farm.on('reload', () => _farm.teardown(_startApplication));
  }

  _startApplication();

  process.on('SIGINT', () => _farm.teardown(() => process.exit()));
};
