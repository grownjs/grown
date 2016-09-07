'use strict';

const Sequelize = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'db.sqlite',
  define: {
    timestamps: false,
    freezeTableName: true,
  },
});

const definitions = {
  string: (definition) => {
    switch (definition.format) {
      case 'date-time': return Sequelize.DATE;
      case 'date': return Sequelize.DATEONLY;
      case 'time': return Sequelize.TIME;
      case 'now': return Sequelize.NOW;

      case 'json': return Sequelize.JSON;
      case 'jsonb': return Sequelize.JSONB;

      case 'uuid':
      case 'uuidv4':
        return Sequelize.UUIDV4;

      case 'uuidv1': return Sequelize.UUIDV1;

      case 'char': return Sequelize.NOW;
      case 'text': return Sequelize.TEXT;

      case 'int64':
      case 'bigint':
        return Sequelize.BIGINT;

      case 'int32': return Sequelize.INTEGER;

      case 'number':
      case 'decimal':
        return Sequelize.DECIMAL;

      case 'real':
      case 'float':
      case 'double':
      case 'boolean':
        return Sequelize[definition.format.toUpperCase()];

      default:
        return Sequelize.STRING;
    }
  },

  number: () => Sequelize.DECIMAL,
  integer: () => Sequelize.INTEGER,

  // special types
  array: () => Sequelize.ARRAY,
  range: () => Sequelize.RANGE,
  hstore: () => Sequelize.HSTORE,
  virtual: () => Sequelize.VIRTUAL,
  geometry: () => Sequelize.GEOMETRY,
  geography: () => Sequelize.GEOGRAPHY,
};

function convertSchema(definition) {
  if (Array.isArray(definition.enum)) {
    return Sequelize.ENUM.call(null, definition.enum);
  }

  if (typeof definitions[definition.type] === 'function') {
    return definitions[definition.type](definition);
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

module.exports = (name, props) => {
  const definition = {};

  Object.keys(props).forEach((key) => {
    if (key !== '$schema') {
      definition[key] = props[key];
    }
  });

  return sequelize.define(name, convertSchema(props.$schema), definition);
};
