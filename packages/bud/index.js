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
    '@grown/server',
    '@grown/static',
    '@grown/logger',
    '@grown/graphql',
    '@grown/session',
    '@grown/upload',
    '@grown/test',

    // optionals
    'sqlite3',
    'pg',
  ]);

const path = require('path');

const util = require('./util');

// Grown-container barebones
module.exports = (cwd, argv) => {
  const _argv = util.argvParser(argv || process.argv.slice(2), {
    boolean: ['V', 'd', 's', 'help'],
    string: ['p', 'h', 'a', 'e'],
    alias: {
      V: 'verbose',
      s: 'silent',
      d: 'debug',
      p: 'port',
      h: 'host',
      a: 'app',
      e: 'env',
    },
  });

  const _cwd = path.resolve(cwd || process.cwd());

  // private container
  const $ = util.newContainer();

  const Grown = $('Grown', {
    init(options) {
      if (!Grown.Server) {
        throw new Error('Missing Grown.Server');
      }

      return Grown.Server.create(options);
    },
  });

  util.getLogger = () => {
    if (!Grown.Logger) {
      throw new Error('Missing Grown.Logger');
    }

    return Grown.Logger.getLogger();
  };

  // defaults
  process.name = process.name || 'Grown';

  require('./environment')(_argv);
  require('./configure')($, _cwd, _argv, util);

  return Grown;
};
