'use strict';

/* eslint-disable global-require */

process.env.NODE_ENV = process.env.NODE_ENV || 'dev';

const $ = require('wargs')(process.argv.slice(2));

/* istanbul ignore else */
if ($.flags.debug) {
  require('debug').enable('homegrown,homegrown:*');
}

require('source-map-support').install();

const _ = require('./_util');
const _dev = require('./_dev');
const _repl = require('./_repl');

const chalk = require('chalk');
const homegrown = require('../..');
const test = require('../../lib/test');

const cwd = process.cwd();

// setup environment
homegrown.env(cwd);

let farm;

// small bootstrap
function _startApplication() {
  farm = _dev();

  farm.fetch = test(farm);

  const _close = _repl(farm);

  farm.on('close', () => _close());

  farm.listen('test://', (app) => {
    _.echo(chalk.gray('— Listening at '), chalk.yellow(app.location.href), '\n');
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
