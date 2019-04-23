'use strict';

module.exports = (Grown, util) => {
  const Ajv = require('ajv');
  const jsf = require('json-schema-faker');

  const ajv = new Ajv({
    validateSchema: true,
    jsonPointers: true,
    schemaId: 'auto',
  });

  const defaults = {
    random: Math.random,
    useDefaultValue: false,
    alwaysFakeOptionals: false,
  };

  function _validateFrom(schema, refs, data) {
    return new Promise((resolve, reject) => {
      try {
        this._assertFrom(schema, refs, data);
        resolve(data);
      } catch (e) {
        reject(e);
      }
    });
  }

  function _assertFrom(schema, refs, data) {
    const valid = ajv.validate(refs[schema], data);

    /* istanbul ignore else */
    if (!valid) {
      const err = new Error(`Invalid input for ${schema}`);

      err.sample = data;
      err.schema = refs[schema];
      err.errors = ajv.errors;

      throw err;
    }

    return valid;
  }

  function _fakeAll(schema, refs, opts) {
    jsf.option(util.extendValues(opts, defaults));

    return jsf(schema, refs);
  }

  return Grown('Schema', {
    _validateFrom,
    _assertFrom,
    _fakeAll,

    load(db) {
      if (!(db && db.repository)) {
        throw new Error(`Expecting database, given '${db}'`);
      }

      const map = {};
      const refs = db.repository.schemas;

      Object.keys(refs).forEach(id => {
        map[id] = {
          fake: (nth, opts) => this._fakeAll(nth !== 1
            ? { type: 'array', items: { $ref: id }, minItems: nth || 0 }
            : { $ref: id }, refs, opts),
          assert: data => this._assertFrom(id, refs, data),
          validate: data => this._validateFrom(id, refs, data),
        };
      });

      return map;
    },
  });
};
