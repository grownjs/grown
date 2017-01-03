/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

const JSONSchemaSequelizer = require('json-schema-sequelizer');
const Sequelize = require('sequelize');

const glob = require('glob');
const path = require('path');
const fs = require('fs');

export default (cwd) => {
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

  // TODO: how to fulfill refs?
  const _refs = [];
  const _models = [];

  glob.sync('models/**/*.js', { cwd, nodir: true }).forEach((model) => {
    const modelDefinition = require(path.join(cwd, model));

    const modelName = path.relative('models', model)
      .replace(/(index)?\.js/, '')
      .replace(/Model(\/|$)/g, '');

    /* istanbul ignore else */
    if (!modelDefinition.$schema) {
      modelDefinition.$schema = {};
    }

    /* istanbul ignore else */
    if (!modelDefinition.$schema.id) {
      modelDefinition.$schema.id = modelName;
    }

    _models.push(modelDefinition);
  });

  return (container) => {
    const m = container.extensions.models =
      new JSONSchemaSequelizer(new Sequelize(_config), _models, _refs);

    return () => m.sync();
  };
};
