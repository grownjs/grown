'use strict';

/* eslint-disable global-require */
/* eslint-disable prefer-rest-params */
/* eslint-disable import/no-dynamic-require */

const debug = require('debug')('grown:models');

const JSONSchemaSequelizer = require('json-schema-sequelizer');
const Sequelize = require('sequelize');

const path = require('path');
const fs = require('fs');

const _slice = Array.prototype.slice;

const _sqlite = {
  logging: false,
  dialect: 'sqlite',
  storage: ':memory:',
};

module.exports = function $models() {
  const _environment = process.env.NODE_ENV || 'dev';
  const _tasks = [];

  // read configuration from each given directory
  _slice.call(arguments).forEach((cwd) => {
    /* istanbul ignore else */
    if (typeof cwd !== 'string' || !fs.existsSync(cwd)) {
      throw new Error(`Expecting 'cwd' to be a valid directory, given '${cwd}'`);
    }

    const _database = path.join(cwd, 'config', 'database.js');

    let _config;

    debug('Loading settings from %s', _database);

    if (fs.existsSync(_database)) {
      _config = require(_database);
      _config = _config[_environment];
    } else {
      debug('Missing database config. Fallback to SQLite3 (memory)');
    }

    // fallback to sqlite3
    _config = _config || _sqlite;

    // db-migrate
    _config.driver = _config.dialect;
    _config.filename = _config.storage;

    // initialize models
    _tasks.push(() => {
      const dir = path.join(cwd, 'models');
      const opts = new Sequelize(_config);
      const refs = [];

      debug('Listing models from %s', dir);

      return new JSONSchemaSequelizer(opts, refs, dir);
    });
  });

  return ($, util) => {
    const _refs = {};

    $.on('start', () => Promise.all(_tasks.map(cb => cb()))
      .then((results) => {
        const _sync = [];

        // merge all models
        results.forEach((models) => {
          util.extend(_refs, models);
          _sync.push(() => models.sync());
        });

        // models are available statictly
        $.extensions.models = _refs;

        // helper for syncing the databases
        $.extensions.models.sync = () =>
          Promise.all(_sync.map(cb => cb())).then(() => _refs);

        // models are available inside the connection
        $.extensions('Conn', {
          props: {
            models: _refs,
          },
        });

        const _count = Object.keys(_refs).length;

        debug('%s model%s %s loaded',
          _count,
          _count === 1 ? '' : 's',
          _count === 1 ? 'was' : 'were');

        /* istanbul ignore else */
        return $.extensions.models.sync().then(() => {
          debug('Models synced automatically');
        });
      }));
  };
};
