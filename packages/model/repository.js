'use strict';

module.exports = ($, util) => {
  const Base = require('./base')($, util);

  return $.module('Model.Repository', {
    define(name, definition) {
      /* istanbul ignore else */
      if (!definition.$schema) {
        throw new Error(`Missing $schema for model ${name}, given '${util.inspect(definition)}'`);
      }

      /* istanbul ignore else */
      if (!definition.$schema.id) {
        definition.$schema.id = name;
      }

      if (this.model_container) {
        name = this.model_container.replace('%s', name);
      } else {
        name = `${name}Model`;
      }

      return $.module(name, {
        name,
        extend: Base,
        include: definition,
      });
    },
    connect() {
      return Promise.all(util
        .flattenArgs(arguments)
        .map(model => model.connect(this.database || this.connection)));
    },
  });
};
