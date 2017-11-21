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

module.exports = ($, util) => {
  const JSONSchemaSequelizer = require('json-schema-sequelizer');

  return $.module('Model.Base', {
    _dbs: {},

    connect(name, references) {
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
        this._dbs[name] = new JSONSchemaSequelizer(options, references, this.schemas_folder);
      }

      const definition = {
        $schema: this.$schema,
        hooks: this.hooks || {},
        classMethods: this.classMethods || {},
        getterMethods: this.getterMethods || {},
        setterMethods: this.setterMethods || {},
        instanceMethods: this.instanceMethods || {},
      };

      Object.keys(this).forEach(key => {
        /* istanbul ignore else */
        if (key !== 'connect' && typeof this[key] === 'function') {
          if (HOOK_METHODS.indexOf(key) === -1) {
            definition.classMethods[key] = this[key];
          } else {
            definition.hooks[key] = this[key];
          }
        }
      });

      Object.keys(this.props || {}).forEach(key => {
        const d = util.getDescriptor(this.props, key);

        /* istanbul ignore else */
        if (d.get) {
          definition.getterMethods[key] = d.get;
        }

        /* istanbul ignore else */
        if (d.set) {
          definition.setterMethods[key] = d.set;
        }

        /* istanbul ignore else */
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
        .then(() => this._dbs[name].models[this.$schema.id]);
    },
  });
};
