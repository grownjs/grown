'use strict';

/* eslint-disable global-require */

const _ = require('../lib/util');

const path = require('path');
const chalk = require('chalk');

function isName(value) {
  return /^[A-Za-z\d]+\w*$/.test(value);
}

module.exports = $ => {
  const IS_DEBUG = $.flags.debug === true;

  const Haki = require('haki');

  const haki = new Haki($.flags);

  let name = $._.shift();
  let cwd = false;

  /* istanbul ignore else */
  if (name === '.') {
    name = path.basename(process.cwd());
    cwd = true;
  }

  haki.runGenerator({
    basePath: path.resolve(__dirname, '../skel'),
    prompts: [{
      name: 'appName',
      message: 'Application name',
      validate: value => isName(value) || 'Invalid nam',
    }],
    actions: [{
      type: 'copy',
      srcPath: 'templates/example',
      destPath: cwd ? '' : '{{snakeCase appName}}',
    }],
  }, {
    appName: name,
  })
  .catch(err => {
    _.echo(chalk.red((IS_DEBUG && err.stack) || err.message), '\n');
    _.die(1);
  });
};
