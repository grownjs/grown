'use strict';

/* eslint-disable global-require */

module.exports = (_cmd, $) => {
  const IS_DEBUG = $.flags.debug === true;

  // let the user define the cwd outside
  $.flags.cwd = $.flags.cwd || process.cwd();

  const _ = require('../lib/util');

  const Haki = require('haki');
  const path = require('path');
  const chalk = require('chalk');

  const haki = new Haki($.flags);

  const _base = {
    env: process.env.NODE_ENV,
    is: {
      ci: process.env.NODE_ENV === 'ci',
      dev: process.env.NODE_ENV === 'dev',
      prod: process.env.NODE_ENV === 'prod',
      stage: process.env.NODE_ENV === 'stage',
    },
  };

  haki.load(require.resolve($.flags.template || '../skel/app'));

  function _showDetails(err, result) {
    if (err) {
      _.echo(chalk.red((IS_DEBUG && err.stack) || err.message), '\n');
      _.die(1);
      return;
    }

    result.changes.forEach((f) => {
      _.echo(chalk.green(`✔ ${f.type}`), ' ', chalk.yellow(path.relative($.flags.cwd, f.destPath)), '\n');
    });

    result.failures.forEach((f) => {
      _.echo(chalk.red(`✘ ${f.type}`), ' ', chalk.yellow(path.relative($.flags.cwd, f.destPath)), '\n');
      _.echo(chalk.red(`  ${(IS_DEBUG && f.error.stack) || f.error.toString()}`), '\n');
    });

    if (!(result.error || result.failures.length)) {
      _.echo(chalk.green('✔ Done.\n'));
    } else {
      _.echo(chalk.red(`${result.error
        ? result.error.message
        : 'Try again with --force to apply the changes'}\n`));
      _.die(1);
    }
  }

  function _executeTask() {
    haki.runGenerator(_cmd, _.merge({}, _base, $.data, $.params))
      .then(result => _showDetails(undefined, result))
      .catch(_showDetails);
  }

  function _showTasks() {
    haki.chooseGeneratorList(_.merge({}, _base, $.data, $.params))
      .then(result => _showDetails(undefined, result))
      .catch(_showDetails);
  }

  if (!$.flags.list && _cmd) {
    _executeTask();
  } else {
    _showTasks();
  }
};
