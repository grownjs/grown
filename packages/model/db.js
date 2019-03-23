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

    bundle(options) {
      options = options || {};

      const name = (options.database && options.database.identifier) || 'default';
      const DB = Grown.Model.DB.register(name, options.database);
      const Models = Grown.load(options.models, {
        before(_name, definition) {
          DB[name].add(definition);
        },
        after(_name) {
          return DB[name].models[_name];
        },
      });

      const map = {};

      Object.keys(DB[name].$refs).forEach(ref => {
        if (DB[name].$refs[ref].$schema.properties) {
          Object.defineProperty(map, ref, {
            enumerable: true,
            configurable: false,
            get: () => Models.get(ref),
          });
        }
      });

      return Grown(`Model.DB.$${name}`, {
        _getDB: _name => DB[_name],
        getModel: _name => Models.get(_name),
        connect: DB[name].connect,
        disconnect: DB[name].close,
        connection: DB[name].sequelize.options,
        include: [map],
      });
    },
  });
};
