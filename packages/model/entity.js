'use strict';

const JSF_DEFAULTS = {
  random: Math.random,
  useDefaultValue: false,
  alwaysFakeOptionals: false,
};

module.exports = (Grown, util) => {
  const Ajv = require('ajv');
  const jsf = require('json-schema-faker');

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
      addUsedSchema: false,
      jsonPointers: true,
      schemaId: 'auto',
    });

    refs.forEach(sub => {
      /* istanbul ignore else */
      if (!ajv.getSchema(sub.id)) {
        ajv.addSchema(sub, sub.id);
      }
    });

    const valid = ajv.validate(ref ? { $ref: ref } : id, data);

    /* istanbul ignore else */
    if (!valid) {
      const err = new Error(`Invalid input for ${ref ? id : id.id}`);

      err.sample = data;
      err.errors = ajv.errors;

      throw err;
    }

    return valid;
  }

  function _fakeFrom(id, refs, opts) {
    jsf.option(util.extendValues(opts, JSF_DEFAULTS));

    return jsf.generate(id, refs);
  }

  function _through(id, refs) {
    const [entity, subpath] = id.split('.');
    const ref = subpath ? `${entity}#/definitions/${subpath}` : entity;

    return {
      fakeOne: opts => this._fakeFrom({ $ref: ref }, refs, opts),
      fakeMany: (nth, opts) => this._fakeFrom({ type: 'array', items: { $ref: ref }, minItems: nth || 0 }, refs, opts),
      assert: data => this._assertFrom(id, ref, refs, data),
      validate: data => this._validateFrom(id, ref, refs, data),
    };
  }

  function _schema(id, refs) {
    return {
      fakeOne: opts => this._fakeFrom(id, refs, opts),
      fakeMany: (nth, opts) => this._fakeFrom({ type: 'array', items: id, minItems: nth || 0 }, refs, opts),
      assert: data => this._assertFrom(id, null, refs, data),
      validate: data => this._validateFrom(id, null, refs, data),
    };
  }

  function _wrap(id, def, refs) {
    if (!def) {
      throw new Error(`Missing '${id}' model!`);
    }

    if (typeof def.getSchema === 'undefined') {
      def.getSchema = _id => this._through(_id ? `${def.name}.${_id}` : def.name, refs);
    }

    return def;
  }

  return Grown('Model.Entity', {
    _validateFrom,
    _assertFrom,
    _fakeFrom,
    _through,
    _schema,
    _wrap,

    define(name, params) {
      return Grown.Model.Entity({
        name: `${name}Model`,
        include: [{
          connection: params.connection || {},
          $schema: params.$schema || {},
          hooks: params.hooks || {},
          classMethods: params.classMethods || {},
          getterMethods: params.getterMethods || {},
          setterMethods: params.setterMethods || {},
          instanceMethods: params.instanceMethods || {},
        }],
      });
    },

    connect(options, refs, cwd) {
      const _opts = {};

      // merge defaults first
      util.extendValues(_opts, this.connection, options);

      let name;

      /* istanbul ignore else */
      if (typeof options === 'string') {
        name = options;
        options = null;
      }

      name = name || this.database || _opts.identifier || 'default';

      /* istanbul ignore else */
      if (!Grown.Model.DB.registered(name)) {
        Grown.Model.DB.register(name, {
          config: _opts,
          refs,
          cwd,
        });
      }

      const target = Grown.Model.DB[name];

      // register model on the connection
      target.add({
        $schema: this.$schema,
        hooks: this.hooks,
        classMethods: this.classMethods,
        getterMethods: this.getterMethods,
        setterMethods: this.setterMethods,
        instanceMethods: this.instanceMethods,
      });

      return Promise.resolve()
        .then(() => target.sequelize._resolved || target.connect())
        .then(() => this._wrap(this.$schema.id, target.models[this.$schema.id], target.schemas));
    },

    getSchema(id, refs) {
      return refs
        ? this._through(id ? `${this.$schema.id}.${id}` : this.$schema.id, refs)
        : this._schema(this.$schema, []);
    },
  });
};
