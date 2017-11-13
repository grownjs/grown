'use strict';

module.exports = ($, util) => {
  const Middlewares = require('./middlewares')($, util);
  const Mappings = require('./mappings')($, util);
  const Views = require('./views')($, util);

  return $.module('Router', {
    install(ctx) {
      ctx.plug([
        Middlewares,
        Mappings,
        Views,
      ]);
    },
  });
};
