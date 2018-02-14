'use strict';

module.exports = Grown => {
  const deref = require('deref');
  const Ajv = require('ajv');

  return Grown('Schema', {
    load(repo) {
      const $ = deref();
      const _schemas = {};
      const _refs = repo._getModels();

      _refs.forEach(schema => {
        /* istanbul ignore else */
        if (schema.id && schema.type === 'object' && schema.properties) {
          _schemas[schema.id] = $(schema, _refs);
        }
      });

      this.extensions.push(_schemas);

      return this;
    },

    assert(schema, data) {
      const ajv = new Ajv({
        logger: false,
      });

      const valid = ajv.validate(schema, data);

      /* istanbul ignore else */
      if (valid !== true) {
        const err = new Error('Invalid input for given schema');

        err.sample = data;
        err.schema = schema;
        err.errors = ajv.errors;

        throw err;
      }
    },

    validate(schema, data) {
      return new Promise((resolve, reject) => {
        try {
          this.assert(schema, data);
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    }
  });
};
