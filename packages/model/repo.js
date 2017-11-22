'use strict';

module.exports = ($, util) => {
  const JSONSchemaSequelizer = require('json-schema-sequelizer');

  const Base = require('./base')($, util);

  function _getModels() {
    const _models = [];

    Object.keys(this).forEach(key => {
      /* istanbul ignore else */
      if (typeof this[key] === 'function' && this[key].sequelize) {
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
      const Model = Base({
        include: [this[name]],
      });

      return Model.connect(_opts, refs, cwd);
    }

    return this[name].connect(_opts, refs, cwd);
  }

  return $.module('Model.Repo', {
    _getModel,
    _getModels,

    sync(opts) {
      return JSONSchemaSequelizer.sync(this._getModels(), opts);
    },

    clear(opts) {
      return JSONSchemaSequelizer.clear(this._getModels(), opts);
    },

    connect() {
      const _cwd = this.schemas_directory;
      const _refs = this.schemas;
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
      return Promise.all(this._getModels().map(m => m.sequelize.close()));
    },
  });
};
