'use strict';

/* eslint-disable global-require */

process.env.NODE_ENV = process.env.NODE_ENV || 'dev';

const $ = require('./_argv');

/* istanbul ignore else */
if ($.flags.debug) {
  require('debug').enable('haki,haki:*');
}

const cwd = process.cwd();

const _ = require('./_util');

const Haki = require('haki');
const path = require('path');
const chalk = require('chalk');

const haki = new Haki(cwd);

haki.load(require.resolve('./_tasks'));

function _showDetails(err, result) {
  if (err) {
    console.log(err.toString(), '?');
    _.echo(chalk.red(err), '?\n');
    _.die(1);
    return;
  }

  result.changes.forEach((f) => {
    _.echo(chalk.green(f.type), ' ', chalk.yellow(path.relative(cwd, f.destFile)), '\n');
  });

  result.failures.forEach((f) => {
    _.echo(chalk.red(f.type), ' ', chalk.yellow(path.relative(cwd, f.destFile)), '\n');
    _.echo(chalk.red(`— ${f.error}`), '\n');
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
  const _env = {
    env: process.env.NODE_ENV,
    isDev: process.env.NODE_ENV === 'dev',
    isTest: process.env.NODE_ENV === 'test',
    isProd: process.env.NODE_ENV === 'prod',
    isStage: process.env.NODE_ENV === 'stage',
  };

  const _locals = _.merge({}, _env, $.data);

  haki.runGenerator($.cmd, _locals, $.flags.force)
    .then(result => _showDetails(undefined, result))
    .catch(_showDetails);
}

function _showTasks() {
  haki.chooseGeneratorList(_showDetails);
}

if (!$.flags.list && $.cmd) {
  _executeTask();
} else {
  _showTasks();
}
