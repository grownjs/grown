'use strict';

module.exports = ($, util) => {
  const HTTP = require('./http')($, util);
  const Views = require('./views')($, util);
  const Routes = require('./routes')($, util);
  const Pipeline = require('./pipeline')($, util);
  const Middleware = require('./middleware')($, util);

  return $.module('Router', {
    install(ctx) {
      ctx.plug([
        HTTP,
        Views,
        Routes,
        Pipeline,
        Middleware,
      ]);
    },
  });
};
