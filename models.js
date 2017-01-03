/* eslint-disable global-require */
/* eslint-disable import/no-dynamic-require */

var JSONSchemaSequelizer = require('json-schema-sequelizer');
var Sequelize = require('sequelize');

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

  return function ($) {
    var dir = path.join(cwd, 'models');
    var opts = new Sequelize(_config);
    var refs = [];

    return new JSONSchemaSequelizer(opts, refs, dir)
      .then(function (m) {
        $.extensions.models = m;
      });
  };
};

module.exports = models;
