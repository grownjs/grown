'use strict';

module.exports = (Grown, util) => {
  const JSONSchemaSequelizer = require('json-schema-sequelizer');

  return Grown('Model.DB', {
    _registry: {},

    registered(name) {
      return this._registry[name] instanceof JSONSchemaSequelizer;
    },

    register(name, params) {
      if (this._registry[name]) {
        throw new Error(`Database '${name}' already registred!`);
      }

      if (!params || !params.config) {
        throw new Error(`Missing configuration for '${name}' connection!`);
      }

      if (!params.config.identifier) {
        params.config.identifier = name;
      }

      const opts = (params.use_env_variable && process.env[params.use_env_variable]) || params.config;

      this._registry[name] = new JSONSchemaSequelizer(opts, params.refs, params.cwd);

      util.readOnlyProperty(this, name, () => this._registry[name]);

      return this;
    },

    partial(Model, definition) {
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

    bundle(options) {
      options = options || {};

      /* istanbul ignore else */
      if (!Grown.Model.Entity) {
        Grown.use(require('./entity'));
      }

      const name = (options.database && options.database.identifier) || 'default';
      const DB = Grown.Model.DB.register(name, options.database);

      // scan and load/define models
      const $ = Grown.load(options.models, {
        before(_name, definition) {
          // always add it as model!
          DB[name].add(definition);
        },
        after(_name, definition) {
          // no connection? return it as Entity definition
          if (!DB[name].sequelize._resolved) {
            return Grown.Model.Entity.define(_name, definition);
          }

          return Grown.Model.DB.partial(DB[name].models[_name], definition);
        },
      });

      // reassign values
      DB[name].ready(() => {
        Object.assign($.values, DB[name].models);
      });

      function get(model) {
        return Grown.Model.Entity.wrap($.get(model), Grown.Model.DB[name].schemas);
      }

      return Grown(`Model.DB.${name}.repository`, {
        get connection() { return DB[name].sequelize.options; },
        get sequelize() { return DB[name].sequelize; },
        get schemas() { return DB[name].schemas; },
        get models() { return DB[name].models; },

        disconnect: () => DB[name].disconnect(),
        connect: () => DB[name].connect(),
        get: model => get(model),
      });
    },
  });
};
