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

  // shared connections
  const _dbs = {};

  return $.module('Model.Base', {
    connect(options, refs, cwd) {
      const _opts = {};

      // merge defaults first
      util.extendValues(_opts, this.connection);

      let name;

      /* istanbul ignore else */
      if (Object.prototype.toString.call(options) === '[object Object]') {
        util.extendValues(_opts, options);
      }

      /* istanbul ignore else */
      if (typeof options === 'string') {
        name = options;
        options = null;
      }

      name = name || this.database || _opts.identifier || 'default';

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

      /* istanbul ignore else */
      if (!_dbs[name]) {
        _dbs[name] = new JSONSchemaSequelizer(_opts, refs, cwd);
      }

      // define first
      _dbs[name].add(definition);

      return Promise.resolve()
        .then(() => _dbs[name].connect())
        .then(() => _dbs[name].models[this.$schema.id]);
    },
  });
};
