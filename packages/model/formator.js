'use strict';

module.exports = Grown => {
  const Formator = require('formator');

  return Grown('Model.Formator', {
    from(Model, params, options) {
      return new Formator(this.database).bind(Model, params, options);
    },
    $install(ctx) {
      ctx.mount(this.prefix || '/', new Formator(this.database).hook(this.options));
    },
  });
};
