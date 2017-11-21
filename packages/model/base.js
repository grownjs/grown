'use strict';

module.exports = ($, util) => {
  const JSONSchemaSequelizer = require('json-schema-sequelizer');

  const _connections = Object.create(null);

  return $.module('Model.Base', {
    connect(name) {
      let options = {};

      if (typeof name === 'object') {
        options = name || {};
      } else {
        options = this.connection || {};
      }

      name = name || this.database || 'default';

      /* istanbul ignore else */
      if (!_connections[name]) {
        _connections[name] = new JSONSchemaSequelizer(options);
      }

      _connections[name].add({
        $schema: this.$schema,
      });

      return _connections[name].connect()
        .then(conn => {
          util.readOnlyProperty(this, 'model', () =>
            conn.models[this.$schema.id]);

          return this;
        });
    },
  });
};
