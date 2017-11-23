'use strict';

const JSONSchemaSequelizer = require('json-schema-sequelizer');

module.exports = (Grown, util) => {
  const DB = {};

  return Grown.module('Model.DB', {
    registered(name) {
      return typeof DB[name] !== 'undefined';
    },

    register(name, params) {
      if (DB[name]) {
        throw new Error(`Database '${name}' already registred!`);
      }

      if (!params.config.identifier) {
        params.config.identifier = name;
      }

      DB[name] = new JSONSchemaSequelizer(params.config, params.refs, params.cwd);

      util.readOnlyProperty(this, name, () => DB[name], {
        hiddenProperty: true,
      });

      return DB;
    },
  });
};
