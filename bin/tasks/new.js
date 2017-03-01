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
    prompts: [{
      name: 'appName',
      message: 'Application name',
      validate: value => value.length > 0 || 'Missing name?',
    }, {
      name: 'description',
      message: 'Description',
    }, {
      name: 'fullName',
      message: 'Your fullname',
    }, {
      name: 'email',
      message: 'Your email address',
    }, {
      type: 'list',
      name: 'license',
      message: 'Project license',
      choices: [
        'MIT',
        'GPL-3.0',
        'LGPL-3.0',
        'EPL-1.0',
        'MPL-2.0',
        'CCDL-1.0',
        'BSD-3-Clause',
        'Apache License 2.0',
      ],
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
