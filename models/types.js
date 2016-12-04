const Sequelize = require('sequelize');

function constraintSchema(definition) {
  definition.validate = definition.validate || {};

  const min = definition.minLength || definition.minimum || undefined;
  const max = definition.maxLength || definition.maximum || undefined;

  if (definition.type === 'string') {
    if (min || max) {
      definition.validate.len = [min || 0, max || Infinity];
    }

    if (definition.pattern) {
      definition.validate.is = new RegExp(definition.pattern, 'i');
    }

    switch (definition.format) {
      case 'email':
        definition.validate.isEmail = true;
        break;

      case 'date-time':
      case 'datetime':
        definition.validate.isDate = true;
        break;

      case 'ipv4':
        definition.validate.isIPv4 = true;
        break;

      case 'ipv6':
        definition.validate.isIPv6 = true;
        break;

      // TODO: hostname uri ...
      default:
        // nothing to do?
    }
  }

  if (definition.type === 'number' || definition.type === 'integer') {
    if (definition.type === 'number') {
      definition.validate.isNumeric = true;
    }

    if (definition.type === 'integer') {
      definition.validate.isInt = true;
    }

    if (min >= 0) {
      definition.validate.min = min;
    }

    if (max) {
      definition.validate.max = max;
    }
  }
}

function dropKeywords(definition) {
  delete definition.definitions;
  delete definition.$ref;
  delete definition.required;
  delete definition.pattern;
  delete definition.format;
  delete definition.enum;
  delete definition.minLength;
  delete definition.maxLength;
  delete definition.minimum;
  delete definition.maximum;
  delete definition.exclusiveMinimum;
  delete definition.exclusiveMaximum;
  delete definition.multipleOf;
  delete definition.items;
  delete definition.minItems;
  delete definition.maxItems;
  delete definition.uniqueItems;
  delete definition.additionalItems;
  delete definition.allOf;
  delete definition.oneOf;
  delete definition.anyOf;
  delete definition.properties;
  delete definition.minProperties;
  delete definition.maxProperties;
  delete definition.patternProperties;
  delete definition.additionalProperties;
  delete definition.dependencies;
  delete definition.not;
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
    const _schema = {};

    Object.keys(definition).forEach((key) => {
      _schema[key] = definition[key];
    });

    if (_schema.minLength || _schema.maxLength
      || _schema.minimum || _schema.maximum
      || _schema.pattern || _schema.format) {
      constraintSchema(_schema);
    }

    _schema.type = definitions[definition.type](definition);

    dropKeywords(_schema);

    return _schema;
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
