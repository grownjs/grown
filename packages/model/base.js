'use strict';

module.exports = ($, util) => {
  const JSONSchemaSequelizer = require('json-schema-sequelizer');

  return $.module('Model.Base', {
    _dbs: {},
    _model: null,

    connect(name) {
      let options = {};

      if (typeof name === 'object') {
        options = name || {};
        name = null;
      } else {
        options = this.connection || {};
      }

      name = name || this.database || 'default';

      /* istanbul ignore else */
      if (!this._dbs[name]) {
        this._dbs[name] = new JSONSchemaSequelizer(options);
      }

      const definition = {
        $schema: this.$schema,
        classMethods: this.classMethods || {},
        getterMethods: this.getterMethods || {},
        setterMethods: this.setterMethods || {},
        instanceMethods: this.instanceMethods || {},
      };

      Object.keys(this).forEach(key => {
        if (key !== 'connect' && typeof this[key] === 'function') {
          definition.classMethods[key] = this[key];
        }
      });

      Object.keys(this.props || {}).forEach(key => {
        const d = util.getDescriptor(this.props, key);

        if (d.get) {
          definition.getterMethods[key] = d.get;
        }

        if (d.set) {
          definition.setterMethods[key] = d.set;
        }

        if (d.value) {
          definition.getterMethods[key] = () => d.value;
        }
      });

      Object.keys(this.methods || {}).forEach(key => {
        definition.instanceMethods[key] = this.methods[key];
      });

      return Promise.resolve()
        .then(() => this._dbs[name].add(definition))
        .then(() => this._dbs[name].connect())
        .then(() => {
          this._model = this._dbs[name].models[this.$schema.id];

          return this;
        });
    },
  });
};
