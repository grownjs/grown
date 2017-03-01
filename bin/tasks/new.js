'use strict';

/* eslint-disable global-require */

const _ = require('../lib/util');

const path = require('path');
const chalk = require('chalk');

module.exports = $ => {
  const IS_DEBUG = $.flags.debug === true;

  const Haki = require('haki');

  const haki = new Haki($.flags);

  haki.runGenerator({
    basePath: path.resolve(__dirname, '../skel'),
    abortOnFail: true,
    prompts: [{
      name: 'appName',
      message: 'Application name',
      validate: value => value.length > 0 || 'Missing name?',
    }],
    actions: [{
      type: 'copy',
      srcPath: 'templates/example',
      destPath: '{{snakeCase appName}}',
    }],
  }, {
    appName: $._.shift(),
  })
  .catch(err => {
    _.echo(chalk.red((IS_DEBUG && err.stack) || err.message), '\n');
    _.die(1);
  });
};
