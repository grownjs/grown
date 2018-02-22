'use strict';

const JSONSchemaSequelizer = require('json-schema-sequelizer');

module.exports = (Grown, util) => {
  return Grown('Model.Loader', {
    scan(cwd, _refs) {
      const _models = {};

      JSONSchemaSequelizer.scan(cwd, (def, model, _sequelize) => {
        const _util = util.extendValues({}, util, {
          Sequelize: _sequelize,
        });

        const Model = def(Grown, _util);

        try {
          Object.keys(def).forEach(key => {
            util.readOnlyProperty(Model, key, typeof def[key] === 'function'
              ? def[key](Grown, _util)
              : def[key]);
          });
        } catch (e) {
          throw new Error(`${model} definition failed. ${e.message}`);
        }

        return Model;
      }).forEach(m => {
        _models[m.$schema.id] = m;
      });

      this.extensions.push(_models);

      /* istanbul ignore else */
      if (_refs === true) {
        this.refs(cwd);
      }

      return this;
    },

    refs(cwd) {
      this.extensions.push({
        schemas: JSONSchemaSequelizer.refs(cwd),
      });

      return this;
    },
  });
};
