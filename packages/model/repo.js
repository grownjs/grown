'use strict';

module.exports = (Grown, util) => {
  function _getSchemas() {
    const _refs = {};

    this._getModels()
      .forEach(x => {
        _refs[x.options.$schema.id] = x.options.$schema;
      });

    (this.$refs || []).forEach(schema => {
      const copy = util.extendValues({}, schema);

      /* istanbul ignore else */
      if (_refs[schema.id]) {
        util.extendValues(copy, _refs[schema.id]);
      }

      _refs[schema.id] = copy;
    });

    return _refs;
  }

  function _getModels() {
    const _models = [];

    Object.keys(this).forEach(key => {
      /* istanbul ignore else */
      if (typeof this[key] === 'function' && (this[key].sequelize || this[key].$schema)) {
        _models.push(this[key]);
      }
    });

    return _models;
  }

  function _getModel(name, refs, cwd) {
    /* istanbul ignore else */
    if (!this[name]) {
      throw new Error(`Model '${name}' is not defined`);
    }

    const _opts = this.connection || {};

    /* istanbul ignore else */
    if (!this[name].connect) {
      if (!Grown.Model.Base) {
        Grown.use(require('./base'));
      }

      const Model = Grown.Model.Base({
        name: `${name}Model`,
        include: [{
          $schema: this[name].$schema,
          hooks: this[name].hooks || {},
          classMethods: this[name].classMethods || {},
          getterMethods: this[name].getterMethods || {},
          setterMethods: this[name].setterMethods || {},
          instanceMethods: this[name].instanceMethods || {},
        }],
      });

      this[name].extensions
        .forEach(ext => {
          Model._makeDefinition(ext);
        });

      return Model.connect(_opts, refs, cwd);
    }

    return this[name].connect(_opts, refs, cwd);
  }

  function _getDB(identifier) {
    const _db = ((Grown.Model && Grown.Model.DB) || {})._registry || {};

    /* istanbul ignore else */
    if (!identifier) {
      identifier = Object.keys(_db)[0];
    }

    /* istanbul ignore else */
    if (typeof identifier === 'string' && !_db[identifier]) {
      throw new Error(`Invalid database, given '${identifier}'`);
    }

    return _db[identifier];
  }

  return Grown('Model.Repo', {
    _getSchemas,
    _getModels,
    _getModel,
    _getDB,

    get connection() {
      return this._getDB().sequelize.options;
    },

    get sequelize() {
      return this._getDB().sequelize;
    },

    get schemas() {
      return this._getSchemas();
    },

    get models() {
      return this._getModels();
    },

    refs(index) {
      return require('json-schema-sequelizer').refs(index);
    },

    connect() {
      const _cwd = this.schemas_directory;
      const _refs = this.$refs || [];
      const _tasks = [];

      return Promise.resolve()
        .then(() => {
          Object.keys(this).forEach(key => {
            /* istanbul ignore else */
            if (typeof this[key] === 'function' && this[key].class && this[key].$schema) {
              /* istanbul ignore else */
              if (!this[key].$schema.id) {
                this[key].$schema.id = key;
              }

              _tasks.push(this._getModel(key, _refs, _cwd)
                .then(model => {
                  this[model.name] = model;
                }));
            }
          });
        })
        .then(() => Promise.all(_tasks))
        .then(() => this);
    },

    disconnect() {
      return Promise.all(this._getModels().map(m => m.sequelize.close())).then(() => this);
    },
  });
};
