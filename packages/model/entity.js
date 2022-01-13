'use strict';

const JSF_DEFAULTS = {
  random: Math.random,
  fillProperties: false,
  useDefaultValue: false,
  alwaysFakeOptionals: false,
  pruneProperties: ['belongsToMany', 'belongsTo', 'hasMany'],
};

const CACHED = {};

module.exports = (Grown, util) => {
  const is = require('is-my-json-valid');
  const jsf = require('json-schema-faker');

  function _buildValidator(id, ref, refs) {
    return is({ $ref: ref || id }, {
      schemas: refs.reduce((memo, cur) => {
        if (cur) memo[cur.id] = cur;
        return memo;
      }, {}),
      greedy: true,
    });
  }

  function _validateFrom(id, ref, refs, data) {
    try {
      return this._assertFrom(id, ref, refs, data);
    } catch (e) {
      return false;
    }
  }

  function _assertFrom(id, ref, refs, data, debug) {
    const key = JSON.stringify({ id, ref });
    const check = CACHED[key] || (CACHED[key] = this._buildValidator(id, ref, refs));
    const isValid = check(data);

    /* istanbul ignore else */
    if (!isValid) {
      const err = new Error(`Invalid input for ${ref || id}`);

      err.sample = data;
      err.errors = check.errors.map(e => ({
        field: e.field.replace('data.', ''),
        message: e.message,
      }));
      err.stack = [
        ref || id,
        JSON.stringify(err.sample),
        ...err.errors.map(x => `- ${x.field} ${x.message}`),
      ].join('\n');

      if (debug) {
        console.log('===== FAILURE =====');
        console.log(err.stack);
      }

      throw err;
    }

    return isValid;
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
      assert: (data, debug) => this._assertFrom(entity, ref, refs, data, debug),
      validate: data => this._validateFrom(entity, ref, refs, data),
    };
  }

  function _schema(id, refs) {
    return {
      fakeOne: opts => this._fakeFrom({ $ref: id }, refs, opts),
      fakeMany: (nth, opts) => this._fakeFrom({ type: 'array', items: id, minItems: nth || 0 }, refs, opts),
      assert: (data, debug) => this._assertFrom(id, null, refs, data, debug),
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
    _buildValidator,
    _validateFrom,
    _assertFrom,
    _fakeFrom,
    _through,
    _schema,
    _wrap,

    define(name, params, _refs) {
      if (_refs && _refs[name]) {
        Object.assign(params, _refs[name]);
      }

      const Model = Grown.Model.Entity({
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

      return Model;
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
      const schema = (target.$refs[this.$schema.$ref] || this).$schema;

      // register model on the connection
      target.add({
        $schema: schema,
        hooks: this.hooks,
        classMethods: this.classMethods,
        getterMethods: this.getterMethods,
        setterMethods: this.setterMethods,
        instanceMethods: this.instanceMethods,
      });

      return Promise.resolve()
        .then(() => target.sequelize._resolved || target.connect())
        .then(() => this._wrap(schema.id, target.models[schema.id], target.schemas));
    },

    getSchema(id) {
      const ref = this.$schema.id || this.$schema.$ref;
      const name = this.database || this.connection.identifier || 'default';

      let refs;
      if (Grown.Model.DB[name]) {
        const _refs = Grown.Model.DB[name].$refs;

        refs = Object.keys(_refs).reduce((memo, key) => {
          memo.push(_refs[key].$schema);
          return memo;
        }, []);
      }

      return refs
        ? this._through(id ? `${ref}.${id}` : ref, refs)
        : this._schema(ref, [this.$schema].concat(refs));
    },
  });
};
