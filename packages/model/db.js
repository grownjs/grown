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

      const opts = (params.use_env_variable && process.env[params.use_env_variable]) || params.config;

      this._registry[name] = new JSONSchemaSequelizer(opts, params.refs, params.cwd);

      util.readOnlyProperty(this, name, () => this._registry[name]);

      return this._registry;
    },
  });
};
