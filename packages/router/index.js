'use strict';

module.exports = ($, util) => {
  const Controllers = require('./controllers')($, util);
  const Mappings = require('./mappings')($, util);

  return $.module('Router', {
    install(ctx) {
      ctx.plug([
        Controllers,
        Mappings,
      ]);
    },
  });
};
