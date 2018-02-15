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

module.exports = (Grown, util) => {
  function _makeDefinition(src) {
    Object.keys(src).forEach(key => {
      /* istanbul ignore else */
      if (key !== 'connect' && typeof src[key] === 'function') {
        if (HOOK_METHODS.indexOf(key) === -1) {
          this.classMethods[key] = src[key];
        } else {
          this.hooks[key] = src[key];
        }
      }
    });

    Object.keys(src.props || {}).forEach(key => {
      const d = util.getDescriptor(src.props, key);

      /* istanbul ignore else */
      if (d.get) {
        this.getterMethods[key] = d.get;
      }

      /* istanbul ignore else */
      if (d.set) {
        this.setterMethods[key] = d.set;
      }

      /* istanbul ignore else */
      if (d.value) {
        this.getterMethods[key] = () => d.value;
      }
    });

    Object.keys(src.methods || {}).forEach(key => {
      this.instanceMethods[key] = src.methods[key];
    });
  }

  return Grown('Model.Base', {
    _makeDefinition,

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

      /* istanbul ignore else */
      if (!Grown.Model.DB.registered(name)) {
        Grown.Model.DB.register(name, {
          config: _opts,
          refs,
          cwd,
        });
      }

      // define first
      Grown.Model.DB[name].add({
        $schema: this.$schema,
        hooks: this.hooks,
        classMethods: this.classMethods,
        getterMethods: this.getterMethods,
        setterMethods: this.setterMethods,
        instanceMethods: this.instanceMethods,
      });

      return Promise.resolve()
        .then(() => Grown.Model.DB[name].connect())
        .then(() => {
          const Model = Grown.Model.DB[name].models[this.$schema.id];

          /* istanbul ignore else */
          if (!Model) {
            throw new Error(`${this.$schema.id} model was not defined?`);
          }

          return Model;
        });
    },
  });
};
