'use strict';

/* eslint-disable global-require */

const path = require('path');

module.exports = $ => {
  const Haki = require('haki');

  const haki = new Haki($.flags);

  haki.setGenerator('app', {
    basePath: path.resolve(__dirname, '../skel'),
    prompts: [{
      name: 'appName',
      message: 'Application name:',
      validate: value => value.length > 0 || 'Missing name?',
    }],
    actions: [{
      type: 'copy',
      srcPath: 'templates/skel',
      destPath: '{{snakeCase appName}}',
    }],
  });

  haki.runGenerator('app', { appName: $._.shift() });
};
