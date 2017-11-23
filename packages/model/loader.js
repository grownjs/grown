'use strict';

const JSONSchemaSequelizer = require('json-schema-sequelizer');

module.exports = (Grown, util) => {
  return Grown.module('Model.Loader', {
    scan(cwd, _refs) {
      const _models = JSONSchemaSequelizer.scan(cwd, (def, model, _sequelize) =>
        def(Grown, util.extendValues({}, util, {
          Sequelize: _sequelize,
        })));

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
