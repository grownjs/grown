'use strict';

module.exports = ($, util) => {
  const Base = require('./base')($, util);

  return $.module('Model.Repo', {
    _models: {},

    define(name, definition) {
      /* istanbul ignore else */
      if (!definition.$schema) {
        throw new Error(`Missing $schema for model ${name}, given '${util.inspect(definition)}'`);
      }

      /* istanbul ignore else */
      if (!definition.$schema.id) {
        definition.$schema.id = name;
      }

      util.readOnlyProperty(this, name, () => {
        /* istanbul ignore else */
        if (!this._models[name]._model) {
          throw new Error(`${this.class}[${name}]: missing connection`);
        }

        return this._models[name]._model;
      });

      let className;

      if (this.model_container) {
        className = this.model_container.replace('%s', name);
      } else {
        className = `${name}Model`;
      }

      const m = $.module(className, {
        name,
        extend: Base,
        include: definition,
      });

      this._models[name] = m;

      return m;
    },

    connect(cb) {
      return Promise.all(Object.keys(this._models).map(k =>
        this._models[k].connect(this.database || this.connection)))
      .then(() => typeof cb === 'function' && cb(this._models))
      .then(() => this._models);
    },
  });
};
