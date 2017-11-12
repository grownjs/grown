'use strict';

module.exports = ($, util) => {
  const Base = require('./base')($, util);
  const Http = require('./http')($, util);
  const Views = require('./views')($, util);
  const Routes = require('./routes')($, util);
  const Pipeline = require('./pipeline')($, util);
  const Middleware = require('./middleware')($, util);

  return $.module('Router', {
    install(ctx) {
      ctx.plug([
        Base,
        Http,
        Views,
        Routes,
        Pipeline,
        Middleware,
      ]);
    },
  });
};
