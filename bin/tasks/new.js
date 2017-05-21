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

  /* istanbul ignore else */
  if ($.data.RELOADER
    && ['browser-sync', 'live-reload'].indexOf($.data.RELOADER) === -1) {
    throw new Error(`Unsupported RELOADER=${$.data.RELOADER}`);
  }

  /* istanbul ignore else */
  if ($.data.BUNDLER
    && ['fusebox', 'webpack', 'rollup'].indexOf($.data.BUNDLER) === -1) {
    throw new Error(`Unsupported BUNDLER=${$.data.BUNDLER}`);
  }

  /* istanbul ignore else */
  if ($.data.STYLES
    && ['less', 'sass', 'styl', 'postcss'].indexOf($.data.STYLES) === -1) {
    throw new Error(`Unsupported STYLES=${$.data.STYLES}`);
  }

  /* istanbul ignore else */
  if ($.data.ES6
    && ['buble', 'babel', 'traceur'].indexOf($.data.ES6) === -1) {
    throw new Error(`Unsupported ES6=${$.data.ES6}`);
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
        'formidable',
        'serve-static',

        // database
        $.data.DATABASE === 'mysql' ? 'mysql' : null,
        $.data.DATABASE === 'mssql' ? 'mssql' : null,
        $.data.DATABASE === 'sqlite' ? 'sqlite3' : null,
        $.data.DATABASE === 'postgres' ? ['pg', 'pg-native'] : null,
        $.data.DATABASE ? ['sequelize', 'json-schema-sequelizer'] : null,
      ],
      devDependencies: [
        'eslint',
        'eslint-plugin-import',
        'eslint-config-airbnb-base',
        $.data.DATABASE && $.data.DATABASE !== 'sqlite' ? 'sqlite3' : null,
        $.data.BUNDLER === 'fusebox' ? 'fuse-box' : null,
        $.data.BUNDLER === 'webpack' ? 'webpack' : null,
        $.data.BUNDLER === 'rollup' ? 'rollup' : null,
        $.data.STYLES === 'less' ? ['less', 'less-plugin-autoprefix'] : null,
        $.data.STYLES === 'postcss' ? ['postcss', 'postcss-import', 'postcss-cssnext'] : null,
        $.data.STYLES === 'sass' ? 'node-sass' : null,
        $.data.STYLES === 'styl' ? 'styl' : null,
        $.data.ES6 === 'traceur' ? 'traceur' : null,
        $.data.ES6 === 'babel' ? ['babel-core', 'babel-preset-es2015', 'babel-plugin-transform-react-jsx'] : null,
        $.data.ES6 === 'buble' ? 'buble' : null,
        ['tarima', 'pug', 'talavera'],
      ],
      optionalDependencies: [
        $.data.RELOADER === 'browser-sync' ? 'tarima-browser-sync' : null,
        $.data.RELOADER === 'live-reload' ? 'tarima-lr' : null,
        ['chokidar', 'node-notifier'],
      ],
    }],
  }, _.merge({
    APP_NAME: name,
    CSS_LANG: $.data.STYLES,
    IS_LESS: $.data.STYLES === 'less',
    IS_BUBLE: $.data.ES6 === 'buble',
    IS_BABEL: $.data.ES6 === 'babel',
    IS_ROLLUP: $.data.BUNDLER === 'rollup',
    IS_POSTCSS: $.data.STYLES === 'postcss',
    IS_SQLITE3: $.data.DATABASE === 'sqlite',
    IS_BROWSER_SYNC: $.data.RELOADER === 'browser-sync',
  }, $.data))
  .catch(err => {
    _.echo(chalk.red((IS_DEBUG && err.stack) || err.message), '\r\n');
    _.die(1);
  })
  .then(() => {
    _.echo(chalk.green('Done.'), '\r\n');
  });
};
