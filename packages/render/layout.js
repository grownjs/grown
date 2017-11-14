'use strict';

module.exports = ($, util) => {
  return $.module('Render.Layout', {
    install(ctx, options) {
      $.module('Render.Views', {
        _write(buffer) {
          this.res.write(`[TPL[${buffer}]]`);
        },
      });
    },
  });
};
