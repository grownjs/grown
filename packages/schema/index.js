'use strict';

module.exports = Grown => {
  const deref = require('deref');
  const Ajv = require('ajv');

  return Grown('Schema', {
    load(refs) {
      const $ = deref();
      const _schemas = {};

      refs.forEach(schema => {
        /* istanbul ignore else */
        if (schema.id && schema.type === 'object' && schema.properties) {
          _schemas[schema.id] = $(schema, refs);
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
