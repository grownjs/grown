'use strict';

/* eslint-disable global-require */
/* eslint-disable prefer-rest-params */
/* eslint-disable import/no-dynamic-require */

const JSONSchemaSequelizer = require('json-schema-sequelizer');
const Sequelize = require('sequelize');

const path = require('path');
const fs = require('fs');

module.exports = function _models() {
  const args = Array.prototype.slice.call(arguments);

  const _environment = process.env.NODE_ENV || 'dev';
  const _tasks = [];

  // read configuration from each given directory
  args.forEach((cwd) => {
    /* istanbul ignore else */
    if (typeof cwd !== 'string' || !fs.existsSync(cwd)) {
      throw new Error(`Expecting 'cwd' to be a valid directory, given '${cwd}'`);
    }

    const _defaults = require(path.join(cwd, 'config', 'database.js'));
    const _options = _defaults[_environment];
    const _config = _options || _defaults;

    // db-migrate
    _config.driver = _config.dialect;
    _config.filename = _config.storage;

    // initialize models
    _tasks.push(() => {
      const dir = path.join(cwd, 'models');
      const opts = new Sequelize(_config);
      const refs = [];

      return new JSONSchemaSequelizer(opts, refs, dir);
    });
  });

  return ($, util) => {
    const _refs = {};

    $.up(() => Promise.all(_tasks.map(cb => cb()))
      .then((results) => {
        const _sync = [];

        // merge all models
        results.forEach((models) => {
          _sync.push(models.sync);
          util.extend(_refs, models);
        });

        // models are available inside the connection
        $.extensions('Homegrown.conn', {
          props: {
            models: _refs,
          },
        });

        // models are available statictly
        $.extensions.models = _refs;

        // helper for syncing the databases
        $.extensions.models.sync = () =>
          Promise.all(_sync.map(cb => cb())).then(() => _refs);
      }));
  };
};
