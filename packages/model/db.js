'use strict';

const JSONSchemaSequelizer = require('json-schema-sequelizer');

module.exports = (Grown, util) => {
  return Grown('Model.DB', {
    _registry: {},

    registered(name) {
      return typeof this._registry[name] !== 'undefined';
    },

    register(name, params) {
      if (this._registry[name]) {
        throw new Error(`Database '${name}' already registred!`);
      }

      if (!params.config.identifier) {
        params.config.identifier = name;
      }

      this._registry[name] = new JSONSchemaSequelizer(params.config, params.refs, params.cwd);

      util.readOnlyProperty(this, name, () => this._registry[name]);

      return this._registry;
    },
  });
};
