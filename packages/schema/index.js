'use strict';

module.exports = (Grown, util) => {
  const Ajv = require('ajv');
  const jsf = require('json-schema-faker');

  const defaults = {
    random: Math.random,
    useDefaultValue: false,
    alwaysFakeOptionals: false,
  };

  function _validateFrom(id, ref, refs, data) {
    return new Promise((resolve, reject) => {
      try {
        this._assertFrom(id, ref, refs, data);
        resolve(data);
      } catch (e) {
        reject(e);
      }
    });
  }

  function _assertFrom(id, ref, refs, data) {
    const ajv = new Ajv({
      validateSchema: true,
      jsonPointers: true,
      schemaId: 'auto',
    });

    refs.forEach(sub => {
      ajv.addSchema(sub, sub.id);
    });

    const valid = ajv.validate({ $ref: ref }, data);

    /* istanbul ignore else */
    if (!valid) {
      const err = new Error(`Invalid input for ${id}`);

      err.sample = data;
      err.errors = ajv.errors;

      throw err;
    }

    return valid;
  }

  function _fakeAll(ref, refs, opts) {
    jsf.option(util.extendValues(opts, defaults));

    return jsf(ref, refs);
  }

  return Grown('Schema', {
    _validateFrom,
    _assertFrom,
    _fakeAll,

    get(id, refs) {
      const [entity, subpath] = id.split('.');

      const ref = subpath
        ? `${entity}#/definitions/${subpath}`
        : entity;

      return {
        fake: (nth, opts) => this._fakeAll(nth !== 1
          ? { type: 'array', items: { $ref: ref }, minItems: nth || 0 }
          : { $ref: ref }, refs, opts),
        assert: data => this._assertFrom(id, ref, refs, data),
        validate: data => this._validateFrom(id, ref, refs, data),
      };
    },
  });
};
