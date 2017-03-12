'use strict';

/* eslint-disable global-require */

const _ = require('../lib/util');

const path = require('path');
const chalk = require('chalk');

const PACKAGE_JSON = `{
  "name": "{{paramCase appName}}",
  "version": "0.0.0",
  "main": "app/index.js",
  "scripts": {
    "eslint": "eslint app boot config",
    "start": "grown up"
  }
}
`;

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

  const db = $.flags.database || 'sqlite';

  /* istanbul ignore else */
  if (['sqlite', 'mssql', 'mysql', 'postgres'].indexOf(db) === -1) {
    _.echo(chalk.red(`Unsupported '${db}' database\n`));
    _.die(1);
  }

  const src = $._.shift() || $.flags.template;

  function done(err) {
    _.echo(chalk.red((IS_DEBUG && err.stack) || err.message), '\n');
    _.die(1);
  }

  let task;

  /* istanbul ignore else */
  if (src) {
    const dest = `.github/${src}`;

    task = {
      abortOnFail: true,
      actions: [{
        type: 'clone',
        gitUrl: src,
        destPath: dest,
      }, {
        type: 'copy',
        srcPath: dest,
        destPath: cwd ? '.' : '{{snakeCase appName}}',
      }, {
        type: 'clean',
        destPath: '.github',
      }],
    };
  } else {
    task = {
      abortOnFail: true,
      basePath: path.resolve(__dirname, '../skel'),
      prompts: [{
        name: 'appName',
        message: 'Application name',
        validate: value => isName(value) || 'Invalid name',
      }],
      actions: [{
        type: 'add',
        template: PACKAGE_JSON,
        destPath: cwd ? 'package.json' : '{{snakeCase appName}}/package.json',
      }, {
        type: 'copy',
        srcPath: 'templates/example',
        destPath: cwd ? '.' : '{{snakeCase appName}}',
      }, {
        type: 'install',
        destPath: cwd ? '.' : '{{snakeCase appName}}',
        dependencies: ['grown', 'csurf', 'morgan', 'body-parser', 'serve-static'],
        optionalDependencies: ['eslint', 'eslint-plugin-import', 'eslint-config-airbnb-base'],
      }],
    };
  }

  haki.runGenerator(task, {
    appName: name,
    db: {
      mssql: db === 'mssql',
      mysql: db === 'mysql',
      sqlite: db === 'sqlite',
      postgres: db === 'postgres',
    },
  })
  .catch(done);
};
