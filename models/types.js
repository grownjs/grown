const Sequelize = require('sequelize');

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

module.exports = function convertSchema(definition) {
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
};
