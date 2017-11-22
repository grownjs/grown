'use strict';

module.exports = ($, util) => {
  const JSONSchemaSequelizer = require('json-schema-sequelizer');

  return $.module('Model.Loader', {
    scan(cwd) {
      const db = new JSONSchemaSequelizer(null, [], cwd)
        .scan((def, model, _sequelize) => {
          const Model = def($, util.extendValues({}, util, {
            Sequelize: _sequelize,
          }));

          Object.keys(def).forEach(key => {
            util.readOnlyProperty(Model, key, def[key]);
          });

          return Model;
        });

      const _refs = util.extendValues({}, db.refs);

      this.extensions.push(_refs);

      return this;
    },
  });
};
