'use strict';

module.exports = ($, util) => {
  const Base = require('./base')($, util);

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

    connect(cb) {
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
        .then(() => typeof cb === 'function' && cb(null, this))
        .catch(e => {
          /* istanbul ignore else */
          if (typeof cb === 'function') {
            return cb(e, this);
          }

          throw e;
        })
        .then(() => this);
    },
  });
};
