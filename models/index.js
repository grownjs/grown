'use strict';

/* eslint-disable global-require */

const Sequelize = require('sequelize');

const glob = require('glob');
const path = require('path');
const fs = require('fs');

const fakeSchema = require('./fake');
const convertSchema = require('./types');

function _model(name, props, $schema, sequelize) {
  const model = sequelize.define(name, $schema ? convertSchema($schema) : null, props);

  model.$schemaDefinition = $schema;

  return fakeSchema(model);
}

function _hook(cwd) {
  return (container) => {
    container.extensions.models = {};

    /* istanbul ignore else */
    if (typeof cwd !== 'string' || !fs.existsSync(cwd)) {
      throw new Error(`Expecting 'cwd' to be a valid directory, given '${cwd}'`);
    }

    const _defaults = require(path.join(cwd, 'config', 'database.js'));
    const _options = _defaults[process.env.NODE_ENV || 'dev'];
    const _config = _options || _defaults;
    const _models = {};
    const _tasks = [];

    // db-migrate
    _config.driver = _config.dialect;
    _config.filename = _config.storage;

    const _sequelize = new Sequelize(_config);

    glob.sync('models/**/*.js', { cwd, nodir: true }).forEach((model) => {
      const definition = require(path.join(cwd, model));
      const $schema = definition.$schema || {};

      delete definition.$schema;

      const modelName = $schema.id || path.relative('models', model)
        .replace(/(index)?\.js/, '')
        .replace(/Model(\/|$)/g, '');

      const tableName = definition.table || modelName
        .replace(/[A-Z]/g, ($0) => `_${$0}`)
        .replace(/^_/, '')
        .toLowerCase();

      _models[modelName] = _model(tableName, definition, $schema, _sequelize);
      _tasks.push(() => _models[modelName].sync());

      Object.defineProperty(container.extensions.models, modelName, {
        configurable: false,
        enumerable: true,
        get() {
          return _models[modelName];
        },
        set() {
          throw new Error(`Model '${name}' is already defined`);
        },
      });
    });

    return Promise.all(_tasks.map(cb => cb()));
  };
}

module.exports = _hook;
module.exports.m = _model;
