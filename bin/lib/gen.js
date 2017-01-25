'use strict';

/* eslint-disable global-require */

process.env.NODE_ENV = process.env.NODE_ENV || 'dev';

const args = process.argv.slice(2);

let _cmd = args.shift();

// skip flags or params
if (_cmd && !/^\w[\w:.-]+$/.test(_cmd)) {
  args.unshift(_cmd);

  // default action
  _cmd = '';
}

const $ = require('wargs')(args);

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

const _base = {
  env: process.env.NODE_ENV,
  is: {
    ci: process.env.NODE_ENV === 'ci',
    dev: process.env.NODE_ENV === 'dev',
    prod: process.env.NODE_ENV === 'prod',
    stage: process.env.NODE_ENV === 'stage',
  },
};

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
  haki.runGenerator(_cmd, _.merge({}, _base, $), $.flags.force)
    .then(result => _showDetails(undefined, result))
    .catch(_showDetails);
}

function _showTasks() {
  haki.chooseGeneratorList(_.merge({}, _base, $), _showDetails);
}

if (!$.flags.list && _cmd) {
  _executeTask();
} else {
  _showTasks();
}
