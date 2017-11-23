'use strict';

const glob = require('glob');
const path = require('path');

module.exports = ($, util) => {
  const JSONSchemaSequelizer = require('json-schema-sequelizer');

  return $.module('Model.Loader', {
    scan(cwd, _refs) {
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

      const _models = util.extendValues({}, db.refs);

      this.extensions.push(_models);

      /* istanbul ignore else */
      if (_refs === true) {
        this.refs(cwd);
      }

      return this;
    },

    refs(cwd) {
      const _schemas = [];

      glob.sync('**/*.json', { cwd }).forEach(json => {
        /* istanbul ignore else */
        if (json.indexOf('schema.json') === -1) {
          _schemas.push(require(path.join(cwd, json)));
        }
      });

      this.extensions.push({
        schemas: _schemas,
      });

      return this;
    },
  });
};
