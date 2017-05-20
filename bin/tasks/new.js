'use strict';

/* eslint-disable global-require */

const _ = require('../lib/util');

const path = require('path');
const chalk = require('chalk');

const DATABASE_TEMPLATE = `module.exports = {
  development: {
    dialect: 'sqlite',
    storage: 'db_{{snakeCase APP_NAME}}_dev.sqlite',
  },{{#IS_SQLITE3}}
  production: {
    dialect: 'sqlite',
    storage: 'db_{{snakeCase APP_NAME}}_prod.sqlite',
  },{{/IS_SQLITE3}}{{^IS_SQLITE3}}
  production: {
    host: 'localhost',
    dialect: '{{DATABASE}}',
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: '{{snakeCase APP_NAME}}_prod',
  },{{/IS_SQLITE3}}
};
`;

module.exports = ($, cwd) => {
  const IS_DEBUG = $.flags.debug === true;

  let name = $._.shift();

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

  /* istanbul ignore else */
  if ($.data.DATABASE
    && ['postgres', 'mysql', 'mssql', 'sqlite'].indexOf($.data.DATABASE) === -1) {
    throw new Error(`Unsupported DATABASE=${$.data.DATABASE}`);
  }

  const Haki = require('haki');

  const haki = new Haki(cwd, _.merge({}, $.flags));

  haki.runGenerator({
    abortOnFail: true,
    basePath: path.join(__dirname, '../skel/template'),
    actions: [{
      copy: '.',
      src: '.',
    }, {
      render: [
        'package.json',
        'app/server.js',
      ],
    }, $.data.DATABASE ? {
      type: 'add',
      dest: 'config/database.js',
      template: DATABASE_TEMPLATE,
    } : null, {
      type: 'install',
      dependencies: [
        'grown',
        'route-mappings',

        // required
        'csurf',
        'body-parser',
        'cookie-parser',
        'cookie-session',

        // common
        'winston',
        'formidable',
        'serve-static',

        // database
        $.data.DATABASE === 'mysql' ? 'mysql' : null,
        $.data.DATABASE === 'mssql' ? 'mssql' : null,
        $.data.DATABASE === 'sqlite' ? 'sqlite3' : null,
        $.data.DATABASE === 'postgres' ? ['pg', 'pg-native'] : null,
        $.data.DATABASE ? ['sequelize', 'pateketrueke/json-schema-sequelizer'] : null,
      ],
      devDependencies: [
        'eslint',
        'eslint-plugin-import',
        'eslint-config-airbnb-base',
        $.data.DATABASE && $.data.DATABASE !== 'sqlite' ? 'sqlite3' : null,
        ['tarima', 'pug', 'less', 'buble', 'rollup', 'talavera', 'less-plugin-autoprefix'],
      ],
      optionalDependencies: [
        ['tarima-lr', 'chokidar', 'node-notifier'],
      ],
    }],
  }, _.merge({
    APP_NAME: name,
    IS_SQLITE3: $.data.DATABASE === 'sqlite',
  }, $.data))
  .catch(err => {
    _.echo(chalk.red((IS_DEBUG && err.stack) || err.message), '\r\n');
    _.die(1);
  })
  .then(() => {
    _.echo(chalk.green('Done.'), '\r\n');
  });
};
