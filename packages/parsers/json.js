'use strict';

module.exports = Grown => {
  return Grown.module('Parsers.JSON', {
    json_options: {
      limit: '5mb',
    },
    install(ctx) {
      ctx.mount(require('body-parser').json(this.json_options));
    },
  });
};
