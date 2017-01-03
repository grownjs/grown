/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

var JSONSchemaSequelizer = require('json-schema-sequelizer');
var Sequelize = require('sequelize');

var glob = require('glob');
var path = require('path');
var fs = require('fs');

var models = function (cwd) {
  /* istanbul ignore else */
  if (typeof cwd !== 'string' || !fs.existsSync(cwd)) {
    throw new Error(("Expecting 'cwd' to be a valid directory, given '" + cwd + "'"));
  }

  var _defaults = require(path.join(cwd, 'config', 'database.js'));
  var _environment = process.env.NODE_ENV || 'dev';
  var _options = _defaults[_environment];
  var _config = _options || _defaults;

  // db-migrate
  _config.driver = _config.dialect;
  _config.filename = _config.storage;

  // TODO: how to fulfill refs?
  var _refs = [];
  var _models = [];

  glob.sync('models/**/*.js', { cwd: cwd, nodir: true }).forEach(function (model) {
    var modelDefinition = require(path.join(cwd, model));

    var modelName = path.relative('models', model)
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

  return function (container) {
    var m = container.extensions.models =
      new JSONSchemaSequelizer(new Sequelize(_config), _models, _refs);

    return function () { return m.sync(); };
  };
};

module.exports = models;
