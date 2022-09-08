'use strict';

const path = require('path');

module.exports = (Grown, util) => {
  const JSONSchemaSequelizer = require('json-schema-sequelizer');
  const { highlight } = require('sql-highlight');

  const _registry = Object.create(null);

  function _logging(msg) {
    if (msg.includes(':')) {
      const prefix = msg.substr(0, msg.indexOf(':') + 1);
      const query = msg.substr(msg.indexOf(':') + 2);

      console.debug(`\x1b[1;30m${prefix} ${highlight(query)}`);
    } else {
      console.debug(msg);
    }
  }

  function _decorate(source, target, _schema) {
    /* istanbul ignore else */
    if (!target._resolved) {
      target._resolved = true;

      /* istanbul ignore else */
      if (source.hooks) {
        Object.keys(source.hooks).forEach(key => {
          target.addHook(key, source.hooks[key]);
        });
      }

      Object.assign(target, source.classMethods);
      Object.assign(target.prototype, source.instanceMethods);
    }
    /* istanbul ignore else */
    target.$schema = { $ref: _schema };
    return target;
  }

  function _typedefs(self, _options) {
    if (_options.types) {
      const typedefs = _options.main || '@grown/model';

      const module = [];
      const refs = [];
      const set = self.typesOf({
        extend: 'ModelInterface',
        properties: ['classMethods', 'instanceMethods'],
        declaration: 'resource:class',
        references: id => {
          const doc = _options.comments ? `/**\nThe \`${id}\` module.\n*/\n` : '';

          return `${doc}interface ${id}Module extends ModelDefinition {}`;
        },
      }).reduce((memo, cur) => {
        if (cur.type) {
          const doc = _options.comments ? `/**\nDeclaration of \`${cur.type}\` instance.\n*/\n` : '';

          refs.push(cur.type);
          module.push({
            chunk: `${doc}export interface ${cur.type}Model extends ${cur.type}, Model, ${cur.type}Class.InstanceMethods {}`,
          });
        }
        memo.push(cur);
        return memo;
      }, []);

      const buffer = [
        '// This file was automatically generated, do not modify.',
        `import type { Model, ModelStatic, ModelInterface, ModelDefinition } from '${typedefs}';`,
        `import type { ${refs.join(', ')} } from '${path.relative(_options.models, _options.types)}';`,
        `export * from '${path.relative(_options.models, _options.types)}';`,
      ].concat(set.map(x => x.chunk))
        .concat(module.map(x => x.chunk))
        .concat(refs.map(x => [
          _options.comments && `/**\nDeclaration of \`${x}\` model.\n*/`,
          `export type ${x}Class = ModelStatic<${x}Model> & ${x}Class.ClassMethods;`,
        ].filter(Boolean).join('\n')))
        .concat([
          `/**\nFound modules from \`${path.relative('.', _options.models)}\`\n*/`,
          `export default interface Models {\n${refs.map(x => [
            _options.comments && `/**\nThe \`${x}\` model.\n*/\n`,
            `  ${x}: ${x}Class;\n`,
          ].filter(Boolean).join('')).join('')}}`,
        ])
        .join('\n');

      return buffer;
    }
  }

  return Grown('Model.DB', {
    _logging,
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

        params.config.environment = process.env.NODE_ENV || 'development';

        if (params.config.logging !== false) {
          params.config.logging = process.env.REMOVE_LOG === 'YES' ? false : this._logging;
        }

        const opts = (params.use_env_variable && process.env[params.use_env_variable]) || params.config;

        this._registry[name] = new JSONSchemaSequelizer(opts, params.refs, params.cwd);

        util.readOnlyProperty(this, name, () => this._registry[name]);
      }
      return this;
    },

    bundle(options) {
      /* istanbul ignore else */
      if (!options || !options.database) {
        throw new TypeError(`Missing database, given '${JSON.stringify(options)}'`);
      }

      /* istanbul ignore else */
      if (!Grown.Model.Entity) {
        Grown.use(require('./entity'));
      }

      const name = options.database.identifier || 'default';
      const DB = Grown.Model.DB.register(name, options.database);

      if (options.database.hooks && !DB[name].sequelize._resolved) {
        Object.keys(options.database.hooks).forEach(key => {
          DB[name].sequelize.addHook(key, options.database.hooks[key]);
        });
      }

      // scan and load/define models
      const $ = Grown.load(options.models, {
        before: (_name, definition) => {
          if (!definition.$schema) {
            throw new TypeError(`Definition for ${_name}.$schema is missing, given '${JSON.stringify(definition, null, 2)}'`);
          }

          if (definition.$schema.id !== _name) {
            throw new TypeError(`Given ${_name}.$schema.id should be '${_name}', given '${JSON.stringify(definition.$schema, null, 2)}'`);
          }

          // always add it as model!
          return DB[name].add(definition, true);
        },
        after: (_name, definition) => {
          if (DB[name].sequelize._resolved && DB[name].$refs[_name]) {
            return this._decorate(definition, DB[name].models[_name], _name);
          }

          // no connection? return it as Entity definition
          return Grown.Model.Entity.define(_name, definition);
        },
      });

      function get(model, refresh) {
        const target = DB[name].sequelize._resolved
          ? DB[name].models[model]
          : $.get(model);

        if (!$.has(model)) {
          return Grown.Model.Entity._wrap(model, this._decorate({}, target, model), DB[name].schemas);
        }

        return Grown.Model.Entity._wrap(model, this._decorate($.get(model, refresh), target, model), DB[name].schemas);
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
        get typedefs() { return _typedefs($, options); },
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
