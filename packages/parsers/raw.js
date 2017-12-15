'use strict';

module.exports = Grown => {
  return Grown('Parsers.RAW', {
    raw_options: {},
    install(ctx) {
      ctx.mount(require('body-parser').json(this.raw_options));
    },
  });
};
