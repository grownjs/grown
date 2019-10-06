'use strict';

module.exports = Grown => {
  return Grown('Parsers.TEXT', {
    text_options: {},
    $install(ctx) {
      ctx.mount(require('body-parser').text(this.text_options));
    },
  });
};
