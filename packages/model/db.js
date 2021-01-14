'use strict';

module.exports = (Grown, util) => {
  const JSONSchemaSequelizer = require('json-schema-sequelizer');

  const _registry = Object.create(null);

  function _decorate(source, target, resolve) {
    /* istanbul ignore else */
    if (!target._resolved) {
      target._resolved = resolve;

      /* istanbul ignore else */
      if (source.hooks) {
        Object.keys(source.hooks).forEach(key => {
          target.options.hooks[key] = [].concat(source.hooks[key]);
        });
      }

      Object.assign(target, source.classMethods);
      Object.assign(target.prototype, source.instanceMethods);
    }
    return target;
  }

  return Grown('Model.DB', {
    _registry,
    _decorate,

    registered(name) {
      return this._registry[name] instanceof JSONSchemaSequelizer;
    },

    register(name, params) {
      if (!this._registry[name]) {
        if (!params || !params.config) {
          throw new Error(`Missing configuration for '${name}' connection!`);
        }

        if (!params.config.identifier) {
          params.config.identifier = name;
        }

        const opts = (params.use_env_variable && process.env[params.use_env_variable]) || params.config;

        this._registry[name] = new JSONSchemaSequelizer(opts, params.refs, params.cwd);

        util.readOnlyProperty(this, name, () => this._registry[name]);
      }
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
        before: (_name, definition) => {
          // always add it as model!
          DB[name].add(definition);
        },
        after: (_name, definition) => {
          if (DB[name].sequelize._resolved && DB[name].$refs[_name]) {
            return this._decorate(definition, DB[name].models[_name]);
          }

          // no connection? return it as Entity definition
          return Grown.Model.Entity.define(_name, definition);
        },
      });

      function get(model, refresh) {
        const target = DB[name].sequelize._resolved
          ? DB[name].models[model]
          : $.get(model);

        return Grown.Model.Entity._wrap(model, this._decorate($.get(model, refresh), target, true), DB[name].schemas);
      }

      // reassign values
      DB[name].ready(() => {
        Object.keys(DB[name].$refs).forEach(k => {
          if (DB[name].$refs[k].$references) get.call(this, k, true);
        });
      });

      return Grown(`Model.DB.${name}.repository`, {
        get connection() { return DB[name].sequelize.options; },
        get sequelize() { return DB[name].sequelize; },
        get schemas() { return DB[name].schemas; },
        get models() { return DB[name].models; },
        get $refs() { return DB[name].$refs; },

        disconnect: () => DB[name].close(),
        connect: () => DB[name].connect(),
        sync: opts => DB[name].sync(opts),
        get: m => get.call(this, m),
      });
    },
  });
};
