'use strict';

const HOOK_METHODS = [
  'beforeValidate', 'afterValidate', 'validationFailed',
  'beforeCreate', 'afterCreate',
  'beforeDestroy', 'afterDestroy',
  'beforeRestore', 'afterRestore',
  'beforeUpdate', 'afterUpdate',
  'beforeSave', 'afterSave',
  'beforeUpsert', 'afterUpsert',
  'beforeBulkCreate', 'afterBulkCreate',
  'beforeBulkDestroy', 'afterBulkDestroy',
  'beforeBulkRestore', 'afterBulkRestore',
  'beforeBulkUpdate', 'afterBulkUpdate',
  'beforeFind', 'beforeFindAfterExpandIncludeAll', 'beforeFindAfterOptions', 'afterFind',
  'beforeCount',
  'beforeDefine', 'afterDefine',
  'beforeInit', 'afterInit',
  'beforeConnect', 'afterConnect',
  'beforeSync', 'afterSync',
  'beforeBulkSync', 'afterBulkSync',
];

const JSF_DEFAULTS = {
  random: Math.random,
  useDefaultValue: false,
  alwaysFakeOptionals: false,
};

module.exports = (Grown, util) => {
  const Ajv = require('ajv');
  const jsf = require('json-schema-faker');

  function _makeDefinition(src) {
    Object.keys(src).forEach(key => {
      /* istanbul ignore else */
      if (key !== 'connect' && typeof src[key] === 'function') {
        if (HOOK_METHODS.indexOf(key) === -1) {
          this.classMethods[key] = src[key];
        } else {
          this.hooks[key] = src[key];
        }
      }
    });

    Object.keys(src.props || {}).forEach(key => {
      const d = util.getDescriptor(src.props, key);

      /* istanbul ignore else */
      if (d.get) {
        this.getterMethods[key] = d.get;
      }

      /* istanbul ignore else */
      if (d.set) {
        this.setterMethods[key] = d.set;
      }

      /* istanbul ignore else */
      if (d.value) {
        this.getterMethods[key] = () => d.value;
      }
    });

    Object.keys(src.methods || {}).forEach(key => {
      this.instanceMethods[key] = src.methods[key];
    });
  }

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

    return jsf(id, refs);
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
    _makeDefinition,
    _validateFrom,
    _assertFrom,
    _fakeFrom,
    _through,
    _schema,
    _wrap,

    define(name, params) {
      const target = Grown.Model.Entity({
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

      if (params.extensions) {
        params.extensions.forEach(ext => this._makeDefinition(ext));
      }

      return target;
    },

    connect(options, refs, cwd) {
      const _opts = {};

      // merge defaults first
      util.extendValues(_opts, this.connection);

      /* istanbul ignore else */
      if (Object.prototype.toString.call(options) === '[object Object]') {
        util.extendValues(_opts, options);
      }

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

      // register model on the connection
      Grown.Model.DB[name].add({
        $schema: this.$schema,
        hooks: this.hooks,
        classMethods: this.classMethods,
        getterMethods: this.getterMethods,
        setterMethods: this.setterMethods,
        instanceMethods: this.instanceMethods,
      });

      return Promise.resolve()
        .then(() => Grown.Model.DB[name].connect())
        .then(() => this._wrap(this.$schema.id, Grown.Model.DB[name].models[this.$schema.id], Grown.Model.DB[name].schemas));
    },

    getSchema(id, refs) {
      return refs
        ? this._through(id ? `${this.$schema.id}.${id}` : this.$schema.id, refs)
        : this._schema(this.$schema, []);
    },
  });
};
