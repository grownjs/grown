'use strict';

const Sequelize = require('sequelize');

function omit(obj, keys, _pick) {
  const copy = {};

  Object.keys(obj).forEach((key) => {
    if (_pick ? keys.indexOf(key) > -1 : keys.indexOf(key) === -1) {
      copy[key] = obj[key];
    }
  });

  return copy;
}

function pick(obj, keys) {
  return omit(obj, keys, true);
}

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
      case 'blob': return type('BLOB', pick(definition, ['length']));

      case 'uuid':
      case 'uuidv4':
        return type('UUIDV4');

      case 'uuidv1': return type('UUIDV1');

      case 'char': return type('CHAR', pick(definition, ['length', 'binary']));
      case 'text': return type('TEXT');

      case 'int64':
      case 'bigint':
        return type('BIGINT', pick(definition, ['unsigned', 'zerofill']));

      case 'int32': return type('STRING', pick(definition, ['unsigned', 'zerofill']));

      case 'number':
        return type('DECIMAL', pick(definition, ['unsigned', 'zerofill']));

      case 'real':
      case 'float':
      case 'double':
      case 'boolean':
      case 'decimal':
        return type(definition.format.toUpperCase(), pick(definition, ['unsigned', 'zerofill']));

      default:
        return type('STRING', pick(definition, ['length', 'binary']));
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
    const _params = pick(definition,
        ['fields', 'return', 'length', 'binary', 'unsigned', 'zerofill']);

    const _return = _params.return || null;
    const _fields = _params.fields || [];

    if (!_return) {
      return type('VIRTUAL');
    }

    if (!definitions[_return]) {
      throw new Error(`Unknown definition '${_return}'`);
    }

    delete _params.return;
    delete _params.fields;

    return type('VIRTUAL', definitions[_return](_params), _fields);
  },
};

function convertSchema(definition) {
  if (Array.isArray(definition.enum)) {
    return Sequelize.ENUM.call(null, definition.enum);
  }

  if (typeof definitions[definition.type] === 'function') {
    const _value = definitions[definition.type](omit(definition, ['type']));
    const _params = pick(definition, ['get', 'set', 'validate']);

    _params.type = _value;

    return _params;
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

module.exports = (name, props, sequelize) => {
  const _schema = props
    ? convertSchema(props.$schema)
    : null;

  let _definition;

  if (props) {
    _definition = omit(props, ['$schema']);
  }

  return sequelize.define(name, _schema, _definition);
};
