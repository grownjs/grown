'use strict';

module.exports = ($, util) => {
  const HTTP = require('./http')($, util);
  const Views = require('./views')($, util);
  const Mappings = require('./mappings')($, util);
  const Middleware = require('./middleware')($, util);

  return $.module('Router', {
    install(ctx) {
      ctx.plug([
        HTTP,
        Views,
        Mappings,
        Middleware,
      ]);
    },
  });
};
