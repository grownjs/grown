'use strict';

/* eslint-disable global-require */

const _ = require('../lib/util');

const path = require('path');
// const chalk = require('chalk');

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
  // const IS_DEBUG = $.flags.debug === true;

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

  const haki = new Haki(cwd, _.extend({}, $.flags));

  /* istanbul ignore else */
  if ($.flags.quiet) {
    // _.echo(chalk.gray('↺ Initializing, please wait...'), '\r\r');
  }

  function ask() {
    return haki.runGenerator({
      abortOnFail: true,
      prompts: [{
        name: 'DATABASE',
        type: 'list',
        message: 'Database:',
        choices: [
          { label: 'None (default)', value: null },
          { label: 'PostgreSQL', value: 'postgres' },
          { label: 'MySQL', value: 'mysql' },
          { label: 'MSSQL', value: 'mssql' },
          { label: 'SQLite3', value: 'sqlite' },
        ],
      }, {
        name: 'RELOADER',
        type: 'list',
        message: 'Reloader:',
        choices: [
          { label: 'None (default)', value: null },
          { label: 'LiveReload', value: 'live-reload' },
          { label: 'BrowserSync', value: 'browser-sync' },
        ],
      }, {
        name: 'BUNDLER',
        type: 'list',
        message: 'Bundler:',
        choices: [
          { label: 'None (default)', value: null },
          { label: 'Rollup', value: 'rollup' },
          { label: 'Webpack', value: 'webpack' },
          { label: 'FuseBox', value: 'fusebox' },
        ],
      }, {
        name: 'STYLES',
        type: 'list',
        message: 'Styles:',
        choices: [
          { label: 'None (default)', value: null },
          { label: 'LESS', value: 'less' },
          { label: 'Sass', value: 'sass' },
          { label: 'Styl', value: 'styl' },
          { label: 'PostCSS', value: 'postcss' },
        ],
      }, {
        name: 'ES6',
        type: 'list',
        message: 'Scripts:',
        choices: [
          { label: 'None (default)', value: null },
          { label: 'Bublé', value: 'buble' },
          { label: 'Babel', value: 'babel' },
          { label: 'Traceur', value: 'traceur' },
        ],
      }],
      // merge user-input
      actions: values => {
        Object.keys(values).forEach(key => {
          $.data[key] = values[key] || $.data[key];
        });
      },
    });
  }

  function run() {
    return haki.runGenerator({
      abortOnFail: true,
      basePath: path.join(__dirname, '../skel/template'),
      prompts() {
        console.log('WUT');
      },
      actions: [{
        copy: '.',
        src: '.',
      }, {
        render: [
          'package.json',
          'app/server.js',
        ],
      }, $.data.DATABSE ? {
        type: 'add',
        dest: 'app/models/.gitkeep',
      } : null, $.data.DATABASE ? {
        type: 'add',
        dest: 'config/database.js',
        template: DATABASE_TEMPLATE,
      } : null, {
        type: 'install',
        quiet: $.flags.verbose !== true,
        dependencies: [
          ['grown', 'route-mappings'],
          ['formidable', 'serve-static', 'winston'],
          ['csurf', 'body-parser', 'cookie-parser', 'cookie-session'],
        ],
        devDependencies: [
          ['eslint', 'eslint-plugin-import', 'eslint-config-airbnb-base'],
          ['tarima', 'pug', 'talavera', 'csso', 'google-closure-compiler-js'],
        ],
        optionalDependencies: [
          ['chokidar', 'node-notifier'],
        ],
      }, $.data.DATABASE ? {
        type: 'install',
        quiet: $.flags.verbose !== true,
        dependencies: [
          ['sequelize', 'json-schema-sequelizer'],
          $.data.DATABASE === 'mysql' ? 'mysql' : null,
          $.data.DATABASE === 'mssql' ? 'mssql' : null,
          $.data.DATABASE === 'sqlite' ? 'sqlite3' : null,
          $.data.DATABASE === 'postgres' ? ['pg', 'pg-native'] : null,
        ],
      } : null, ($.data.DATABASE || $.data.BUNDLER || $.data.STYLES || $.data.ES6) ? {
        type: 'install',
        quiet: $.flags.verbose !== true,
        devDependencies: [
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
        ],
      } : null, $.data.RELOADER ? {
        type: 'install',
        quiet: $.flags.verbose !== true,
        optionalDependencies: [
          $.data.RELOADER === 'browser-sync' ? 'tarima-browser-sync' : null,
          $.data.RELOADER === 'live-reload' ? 'tarima-lr' : null,
        ],
      } : null],
    }, _.extend({
      APP_NAME: name,
      CSS_LANG: $.data.STYLES,
      CAN_BUNDLE: $.data.BUNDLER || $.data.STYLES || $.data.ES6,
      IS_NPM: $.flags.npm === true,
      IS_LESS: $.data.STYLES === 'less',
      IS_BUBLE: $.data.ES6 === 'buble',
      IS_BABEL: $.data.ES6 === 'babel',
      IS_ROLLUP: $.data.BUNDLER === 'rollup',
      IS_POSTCSS: $.data.STYLES === 'postcss',
      IS_SQLITE3: $.data.DATABASE === 'sqlite',
      IS_BROWSER_SYNC: $.data.RELOADER === 'browser-sync',
    }, $.data));
  }

  ($.flags.interactive
    ? ask().then(() => run())
    : run())
  .catch(() => {
    // _.echo(chalk.red((IS_DEBUG && err.stack) || err.message), '\r\n');
    _.die(1);
  });
};
