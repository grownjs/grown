'use strict';

/* eslint-disable global-require */

const path = require('path');
const color = require('cli-color');

const _ = require('./_util');
const _repl = require('./_repl');

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
    _.echo(color.blackBright('Listening at '), color.yellow(app.location.href), '\n');
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
