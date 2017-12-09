'use strict';

module.exports = Grown => {
  return Grown.module('Parsers.URLENCODED', {
    urlencoded_options: {
      extended: false,
    },
    install(ctx) {
      ctx.mount(require('body-parser').urlencoded(this.urlencoded_options));
    },
  });
};
