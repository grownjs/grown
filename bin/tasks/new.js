'use strict';

/* eslint-disable global-require */

const _ = require('../lib/util');

const path = require('path');
const chalk = require('chalk');

const CLR = '\x1b[K';

const PACKAGE_JSON = `{
  "name": "{{paramCase APP_NAME}}",
  "version": "0.0.0",
  "main": "app/index.js",
  "scripts": {
    "eslint": "eslint app boot config",
    "start": "grown up"
  }
}
`;

const DATABASE_JSON = `module.exports = {
  {{#DB_SQLITE}}dev: {
    dialect: 'sqlite',
    storage: './DB_DEV.sqlite',
  },{{/DB_SQLITE}}{{#DB_POSTGRES}}dev: {
    host: 'localhost',
    dialect: 'postgres',
    username: 'postgres',
    password: '',
    database: '{{snakeCase APP_NAME}}_dev',
  },{{/DB_POSTGRES}}{{#DB_MYSQL}}dev: {
    host: 'localhost',
    dialect: 'mysql',
    username: 'root',
    password: '',
    database: '{{snakeCase APP_NAME}}_dev',
  },{{/DB_MYSQL}}{{#DB_MSSQL}}dev: {
    host: 'localhost',
    dialect: 'mssql',
    username: 'root',
    password: '',
    database: '{{snakeCase APP_NAME}}_dev',
  },{{/DB_MSSQL}}
};
`;

module.exports = $ => {
  const IS_DEBUG = $.flags.debug === true;

  let name = $._.shift();
  let cwd = process.cwd();

  /* istanbul ignore else */
  if (!name) {
    throw new Error("Missing APP_PATH, it's required!");
  }

  if (name === '.') {
    name = path.basename(cwd);
  } else {
    name = (name || '').replace(/\W+/g, '-');
    cwd = path.join(cwd, name);
  }

  const db = $.flags.database || 'sqlite';

  /* istanbul ignore else */
  if (['sqlite', 'mssql', 'mysql', 'postgres'].indexOf(db) === -1) {
    _.echo(chalk.red(`Unsupported '${db}' database\n`));
    _.die(1);
  }

  function done(err) {
    _.echo(chalk.red((IS_DEBUG && err.stack) || err.message), '\n');
    _.die(1);
  }

  let task;

  const Haki = require('haki');

  const haki = new Haki(cwd, $.flags);

  const base = $.flags.template || path.join(__dirname, '../skel/template');

  if (base.indexOf('/') === base.lastIndexOf('/')) {
    task = {
      abortOnFail: true,
      actions: [{
        clone: base,
        dest: '.',
      }, {
        type: 'install',
      }],
    };
  } else {
    task = {
      abortOnFail: true,
      basePath: base,
      actions: [{
        copy: '.',
        src: '.',
      }, {
        add: 'package.json',
        template: PACKAGE_JSON,
      }, {
        add: 'app/config/database.js',
        template: DATABASE_JSON,
      }, {
        type: 'install',
        dependencies: ['grown', 'csurf', 'morgan', 'body-parser', 'serve-static'],
        optionalDependencies: ['eslint', 'eslint-plugin-import', 'eslint-config-airbnb-base'],
      }],
    };
  }

  haki.runGenerator(task, {
    APP_NAME: name,
    DB_MSSQL: db === 'mssql',
    DB_MYSQL: db === 'mysql',
    DB_SQLITE: db === 'sqlite',
    DB_POSTGRES: db === 'postgres',
  })
  .catch(done)
  .then(() => {
    _.echo(chalk.green('Done.'), CLR, '\n');
  });
};
