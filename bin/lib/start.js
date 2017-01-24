'use strict';

/* eslint-disable global-require */

process.env.NODE_ENV = process.env.NODE_ENV || 'dev';

const IS_DEV = process.env.NODE_ENV === 'dev';

const $ = require('./_argv');

/* istanbul ignore else */
if ($.flags.debug) {
  require('debug').enable('homegrown,homegrown:*');
}

/* istanbul ignore else */
if (IS_DEV) {
  require('source-map-support').install();
}

// common helpers
const _ = require('./_util');
const _dev = require('./_dev');
const _repl = require('./_repl');
const homegrown = require('../..');

const chalk = require('chalk');
const cleanStack = require('clean-stack');

// initialization
let farm;

function _startServer(done) {
  // start server
  farm.listen(process.env.PORT || 8080, (app) => {
    _.echo(chalk.gray('— Listening at '), chalk.yellow(app.location.href), '\n');

    if ($.flags.repl) {
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
    farm = _dev();

    if ($.flags.repl) {
      const _close = _repl(farm);

      farm.on('close', () => _close());
    }

    _startServer(done);
  } catch (e) {
    _.echo(chalk.red(($.flags.debug && cleanStack(e.stack)) || e.message), '\n');
    _.die(1);
  }
}

_startApplication();

function _reload(cb) {
  return homegrown.burn(() => {
    _.clearModules();
    _startApplication(cb);
  });
}

if ($.flags.repl) {
  process.on('repl:reload', () => _reload());
} else {
  process.on('exit', () => homegrown.burn());
  process.on('SIGINT', () => process.exit());
}

// teardown
module.exports = cb => _reload(cb);
