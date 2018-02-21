'use strict';

module.exports = (Grown, util) => {
  const validator = require('is-my-json-valid');
  const jsf = require('json-schema-faker');

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
    const copy = util.extendValues({}, schema);

    const validate = validator(copy, {
      schemas: refs,
      verbose: true,
      greedy: true,
    });

    /* istanbul ignore else */
    if (!validate(data)) {
      const err = new Error(copy.id
        ? `Invalid input for ${copy.id}`
        : 'Invalid input for given schema');

      err.sample = data;
      err.schema = copy;
      err.errors = validate.errors.map(e => {
        e.field = e.field !== 'data'
          ? e.field.substr(5)
          : e.field;

        return e;
      });

      throw err;
    }
  }

  function _fakeAll(schema, refs) {
    return jsf({
      type: 'array',
      items: schema,
      minItems: 1,
    }, refs);
  }

  function _fake(schema, refs) {
    return jsf(schema, refs);
  }

  return Grown('Schema', {
    _validateFrom,
    _assertFrom,
    _fakeAll,
    _fake,

    load(repository) {
      const map = {};
      const refs = repository._getSchemas()

      // FIXME: jsf.option()

      repository._getModels().forEach(model => {
        const schema = refs[model.$schema.id];

        map[model.$schema.id] = {
          fake: () => this._fake(schema, refs),
          fakeAll: () => this._fakeAll(schema, refs),
          assert: data => this._assertFrom(schema, refs, data),
          validate: data => this._validateFrom(schema, refs, data),
        };
      });

      this.extensions.push(map);

      return this;
    },
  });
};
