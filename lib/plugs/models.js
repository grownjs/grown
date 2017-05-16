'use strict';

const debug = require('debug')('grown:models');

const path = require('path');
const fs = require('fs');

const _slice = Array.prototype.slice;

const _sqlite = {
  logging: false,
  dialect: 'sqlite',
  storage: ':memory:',
};

module.exports = function $models() {
  const args = Array.prototype.slice.call(arguments);

  args.forEach(cwd => {
    /* istanbul ignore else */
    if (typeof cwd !== 'string' || !fs.existsSync(cwd)) {
      throw new Error(`Expecting 'cwd' to be a valid directory, given '${cwd}'`);
    }
  });

  const JSONSchemaSequelizer = require('json-schema-sequelizer');
  const Sequelize = require('sequelize');

  const _environment = process.env.NODE_ENV || 'development';
  const _args = _slice.call(arguments);

  // read configuration from each given directory
  function loadTask(cwd, appDir, configDir) {
    const _database = path.join(cwd, configDir, 'database.js');

    let _config;

    debug('Loading settings from %s', _database);

    if (fs.existsSync(_database)) {
      _config = require(_database);
      _config = _config[_environment] || _config;
    } else {
      debug('Missing database config. Fallback to SQLite3 (memory)');
    }

    // fallback to sqlite3
    _config = _config || _sqlite;

    /* istanbul ignore else */
    if (typeof _config === 'object') {
      _config.driver = _config.dialect;
      _config.filename = _config.storage;
    }

    // initialize models
    const dir = path.join(cwd, appDir, 'models');
    const opts = new Sequelize(_config);
    const refs = [];

    debug('Listing models from %s', dir);

    return new JSONSchemaSequelizer(opts, refs, dir);
  }

  return ($, util) => {
    const _refs = {};
    const _close = [];

    _args.unshift($.get('cwd', process.cwd()));

    const _tasks = _args.map(cwd =>
      loadTask(cwd, $.get('appDir', 'app'), $.get('configDir', 'config')));

    $.on('close', () =>
      Promise.all(_close.map(cb => cb())));

    $.on('start', () => Promise.all(_tasks)
      .then(results => {
        const _sync = [];

        // merge all models
        results.forEach(models => {
          util.extend(_refs, models);
          _close.push(() => models.close());
          _sync.push(opts => models.sync(opts));
        });

        const _count = Object.keys(_refs).length - 1;

        // models are available statictly
        $.extensions.models = _refs;

        // helper for syncing the databases
        Object.defineProperty(_refs, 'sync', {
          configurable: false,
          enumerable: false,
          writable: false,
          value: opts =>
            Promise.all(_sync.map(cb => cb(opts)))
            .then(() => _refs)
              .then(() => {
                debug('%s model%s %s synced',
                  _count,
                  _count === 1 ? '' : 's',
                  _count === 1 ? 'was' : 'were');
              }),
        });

        // helper for closing the current connection
        Object.defineProperty(_refs, 'close', {
          configurable: false,
          enumerable: false,
          writable: false,
          value: () =>
            Promise.all(_close.map(cb => cb())),
        });

        // models are available inside the connection
        $.extensions('Conn', {
          props: {
            models: _refs,
          },
        });

        debug('%s model%s %s loaded',
          _count,
          _count === 1 ? '' : 's',
          _count === 1 ? 'was' : 'were');
      }));

    $.on('repl', (repl, logger) => {
      Object.keys(_refs).forEach(key => {
        Object.defineProperty(repl.context, key, {
          configurable: false,
          enumerable: true,
          writable: false,
          value: _refs[key],
        });
      });

      repl.defineCommand('sync', {
        help: 'Synchronize all models',
        action() {
          _refs.sync({ force: true })
            .then(() => logger.ok('All models synced'));
        },
      });
    });
  };
};
