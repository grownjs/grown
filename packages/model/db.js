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
          return Grown.Model.Entity.define(_name, definition);
        },
      });

      // reassign values
      DB[name].ready(() => {
        Object.assign($.values, DB[name].models);
      });

      function get(model) {
        const target = DB[name].sequelize._resolved
          ? DB[name].models[model]
          : $.get(model);

        return Grown.Model.Entity._wrap(model, target, DB[name].schemas);
      }

      return Grown(`Model.DB.${name}.repository`, {
        get connection() { return DB[name].sequelize.options; },
        get sequelize() { return DB[name].sequelize; },
        get schemas() { return DB[name].schemas; },
        get models() { return DB[name].models; },

        disconnect: () => DB[name].close(),
        connect: () => DB[name].connect(),
        sync: opts => DB[name].sync(opts),
        get: model => get(model),
      });
    },
  });
};
