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
        after(_name, definition) {
          const Model = DB[name].models[_name];

          if (definition.hooks) {
            Object.keys(definition.hooks).forEach(hook => {
              Model.addHook(hook, definition.hooks[hook]);
            });
          }

          Object.assign(Model, definition.classMethods);
          Object.assign(Model.prototype, definition.instanceMethods);

          delete definition.hooks;
          delete definition.classMethods;
          delete definition.instanceMethods;

          return Model;
        },
      });

      const map = {};

      function get(model) {
        try {
          return Models.get(model);
        } catch (e) {
          throw new Error(`Unable to load model '${model}'. ${e.message || e.toString()}`);
        }
      }

      Object.keys(DB[name].$refs).forEach(ref => {
        if (DB[name].$refs[ref].$schema.properties) {
          Object.defineProperty(map, ref, {
            get,
            enumerable: true,
            configurable: false,
          });
        }
      });

      DB[name].ready(() => {
        Object.keys(Models.values).forEach(key => {
          if (Models.values[key].$schema) {
            Models.values[key] = DB[name].models[key];
          }
        });
      });

      return Grown(`Model.DB.$${name}`, {
        _getDB: _name => DB[_name],
        getModel: get,
        connect: DB[name].connect,
        disconnect: DB[name].close,
        connection: DB[name].sequelize.options,
        include: [map],
      });
    },
  });
};
