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
    '@grown/server',
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

// Grown-container barebones
module.exports = (cwd, argv) => {
  const _argv = util.argvParser(argv || process.argv.slice(2), {
    boolean: ['V', 'd', 'help'],
    alias: {
      V: 'verbose',
      d: 'debug',
      p: 'port',
      h: 'host',
      e: 'env',
    },
  });

  // private container
  const $ = util.newContainer();

  const Grown = $('Grown', {
    init(options) {
      if (!Grown.Server) {
        throw new Error('Missing Grown.Server');
      }

      return Grown.Server._createServer($, options);
    },
  });

  util.getLogger = () => {
    if (!Grown.Logger) {
      throw new Error('Missing Grown.Logger');
    }

    return Grown.Logger.getLogger();
  };

  // defaults
  process.name = 'Grown';

  require('./environment')(_argv);
  require('./configure')($, cwd || process.cwd(), _argv, util);

  return Grown;
};
