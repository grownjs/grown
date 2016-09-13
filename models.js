'use strict';

/* eslint-disable global-require */

const Sequelize = require('sequelize');

const glob = require('glob');
const path = require('path');
const fs = require('fs');

function type(key, arg1, arg2) {
  if (arg2) {
    return Sequelize[key](arg1, arg2);
  }

  if (arg1) {
    return Sequelize[key](arg1);
  }

  return Sequelize[key]();
}

const definitions = {
  string: (definition) => {
    switch (definition.format) {
      case 'date-time': return type('DATE');
      case 'date': return type('DATEONLY');
      case 'time': return type('TIME');
      case 'now': return type('NOW');

      case 'json': return type('JSON');
      case 'jsonb': return type('JSONB');
      case 'blob': return type('BLOB', definition);

      case 'uuid':
      case 'uuidv4':
        return type('UUIDV4');

      case 'uuidv1': return type('UUIDV1');

      case 'char': return type('CHAR', definition);
      case 'text': return type('TEXT');

      case 'int64':
      case 'bigint':
        return type('BIGINT', definition);

      case 'int32': return type('STRING', definition);

      case 'number':
        return type('DECIMAL', definition);

      case 'real':
      case 'float':
      case 'double':
      case 'boolean':
      case 'decimal':
        return type(definition.format.toUpperCase(), definition);

      default:
        return type('STRING', definition);
    }
  },

  null: () => type('VIRTUAL'),
  boolean: () => type('BOOLEAN'),

  number: (definition) => type('DECIMAL', definition),
  integer: (definition) => type('INTEGER', definition),

  // postgres only
  array: (definition) => {
    if (!definition.items
      || !definition.items.type
      || !definitions[definition.items.type]) {
      throw new Error(`Invalid definition for '${definition}'`);
    }

    return type('ARRAY', definitions[definition.items.type](definition.items));
  },
  object: () => type('JSON'),
  range: () => type('RANGE'),
  hstore: () => type('HSTORE'),
  geometry: () => type('GEOMETRY'),
  geography: () => type('GEOGRAPHY'),

  // virtual types
  virtual: (definition) => {
    if (!definition.return) {
      return type('VIRTUAL');
    }

    if (!definitions[definition.return]) {
      throw new Error(`Unknown definition '${definition.return}'`);
    }

    return type('VIRTUAL', definitions[definition.return](definition), definition.fields || []);
  },
};

function convertSchema(definition) {
  if (Array.isArray(definition.enum)) {
    return Sequelize.ENUM.call(null, definition.enum);
  }

  if (typeof definitions[definition.type] === 'function') {
    const _value = definitions[definition.type](definition);

    definition.type = _value;

    return definition;
  }

  if (!definition.properties) {
    return definition;
  }

  const _props = {};

  Object.keys(definition.properties).forEach((key) => {
    const _value = definition.properties[key];

    if (typeof _value === 'object' && !Array.isArray(_value)) {
      _props[key] = convertSchema(_value);
    }
  });

  return _props;
}

function _model(name, props, $schema, sequelize) {
  return sequelize.define(name, convertSchema($schema.properties), props);
}

function _hook(cwd) {
  return (container) => {
    /* istanbul ignore else */
    if (typeof cwd !== 'string' || !fs.existsSync(cwd)) {
      throw new Error(`Expecting 'cwd' to be a valid directory, given '${cwd}'`);
    }

    const _defaults = require(path.join(cwd, 'config', 'database.js'));
    const _options = _defaults[process.env.NODE_ENV || 'dev'];
    const _config = _options || _defaults;

    // db-migrate
    _config.driver = _config.dialect;
    _config.filename = _config.storage;

    const _sequelize = new Sequelize(_config);

    container.extensions.models = {};

    glob.sync('models/**/*Model.js', { cwd, nodir: true }).forEach((model) => {
      const definition = require(path.join(cwd, model));

      const modelName = definition.name || path.relative('models', model)
        .replace(/\.js$/, '')
        .replace(/Model$/, '');

      const tableName = definition.table || modelName
        .replace(/(<=\w)[A-Z]/g, ($0) => `_${$0}`)
        .toLowerCase();

      const $schema = definition.$schema || {};

      if (!$schema.id) {
        $schema.id = modelName;
      }

      container.extensions.models[modelName] = _model(tableName, definition, $schema, _sequelize);
    });
  };
}

module.exports = _hook;
module.exports.m = _model;
