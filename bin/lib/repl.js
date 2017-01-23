'use strict';

/* eslint-disable global-require */

process.env.NODE_ENV = process.env.NODE_ENV || 'dev';

const IS_DEBUG = process.argv.indexOf('--debug') > -1;
const IS_DEV = process.env.NODE_ENV === 'dev';

/* istanbul ignore else */
if (IS_DEBUG) {
  require('debug').enable('homegrown,homegrown:*');
}

/* istanbul ignore else */
if (IS_DEV) {
  require('source-map-support').install();
}

const path = require('path');
const chalk = require('chalk');

const _ = require('./_util');
const _repl = require('./_repl');

// after if debug
const homegrown = require('../..');
const test = require('../../lib/test');

const cwd = process.cwd();
const Homegrown = homegrown();

// setup environment
homegrown.env(cwd);

let $;

// small bootstrap
function _startApplication() {
  $ = Homegrown.new({
    env: process.env.NODE_ENV || 'dev',
    appDir: path.resolve(cwd, process.env.APP_DIR || 'app'),
    publicDir: path.resolve(cwd, process.env.PUBLIC_DIR || 'public'),
  });

  // standard mvc kit
  $.use(homegrown.plugs.models($.get('appDir'), path.join(__dirname, '_preset')));
  $.use(homegrown.plugs.render($.get('appDir'), path.join(__dirname, '_preset')));
  $.use(homegrown.plugs.router($.get('appDir'), path.join(__dirname, '_preset')));

  $.fetch = test($);

  const _close = _repl($);

  $.on('close', () => _close());

  $.listen('test://', (app) => {
    _.echo(chalk.gray('› Listening at '), chalk.yellow(app.location.href), '\n');
  });
}

_startApplication();

function _reload(cb) {
  return homegrown.burn(() => {
    _.clearModules();
    _startApplication(cb);
  });
}

process.on('repl:reload', () => _reload());
process.on('exit', () => homegrown.burn());
