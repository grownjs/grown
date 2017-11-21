'use strict';

module.exports = ($, util) => {
  const Base = require('./base')($, util);

  function _getModel(name) {
    /* istanbul ignore else */
    if (!this[name]) {
      throw new Error(`Model '${name}' is not defined`);
    }

    /* istanbul ignore else */
    if (!this[name].connect) {
      const Model = Base({
        include: [this[name]],
      });

      return Model.connect(this.database || this.connection);
    }

    return this[name].connect(this.database || this.connection);
  }

  return $.module('Model.Repo', {
    _getModel,

    connect(cb) {
      const _refs = {};
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

              _refs[this[key].$schema.id] = this[key].$schema;

              _tasks.push(() => this._getModel(key, _refs).then(m => {
                this[key] = m;
              }));
            }
          });
        })
        .then(() => Promise.all(_tasks.map(x => x())))
        .then(() => typeof cb === 'function' && cb(this._models))
        .then(() => this);
    },
  });
};
