'use strict';

require('source-map-support').install();

require('global-or-local')
  .dependencies([
    // known-plugins
    '@grown/conn',
    '@grown/grpc',
    '@grown/model',
    '@grown/render',
    '@grown/repl',
    '@grown/router',
    '@grown/schema',
    '@grown/static',
    '@grown/tarima',
    '@grown/logger',
    '@grown/graphql',
    '@grown/parsers',
    '@grown/session',
    '@grown/upload',
    '@grown/test',

    // optionals
    'sqlite3',
    'pg',
    'uws',
  ]);

const util = require('./util');

// @grown/grown barebones
module.exports = (cwd, argv) => {
  const _argv = util.argvParser(argv || process.argv.slice(2), {
    boolean: ['V', 'd', 'help'],
    alias: {
      V: 'verbose',
      d: 'debug',
      e: 'env',
    },
  });

  // private container
  const $ = util.newContainer();

  const Grown = $('Grown', () => {
    throw new Error('Not implemented');
  });

  // defaults
  process.name = 'Grown (bare)';

  require('./environment')(_argv);
  require('./configure')($, cwd || process.cwd(), _argv, Grown);

  return Grown;
};
