'use strict';

/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

// const Sequelize = require('sequelize');

const glob = require('glob');
const path = require('path');
const fs = require('fs');

function _hook(cwd) {
  /* istanbul ignore else */
  if (typeof cwd !== 'string' || !fs.existsSync(cwd)) {
    throw new Error(`Expecting 'cwd' to be a valid directory, given '${cwd}'`);
  }

  const _defaults = require(path.join(cwd, 'config', 'database.js'));
  const _environment = process.env.NODE_ENV || 'dev';
  const _options = _defaults[_environment];
  const _config = _options || _defaults;

  // db-migrate
  _config.driver = _config.dialect;
  _config.filename = _config.storage;

  // const _sequelize = new Sequelize(_config);
  const _models = [];

  glob.sync('models/**/*.js', { cwd, nodir: true }).forEach((model) => {
    const modelDefinition = require(path.join(cwd, model));

    const modelName = path.relative('models', model)
      .replace(/(index)?\.js/, '')
      .replace(/Model(\/|$)/g, '');

    const tableName = modelName
      .replace(/[A-Z]/g, $0 => `_${$0}`)
      .replace(/^_/, '')
      .toLowerCase();

    _models.push({ tableName, modelName, modelDefinition });
  });

  return (container) => {
    container.extensions.models = _models;

    return _models;
  };
}

module.exports = _hook;
