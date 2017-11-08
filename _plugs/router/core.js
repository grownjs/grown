'use strict';

module.exports = $ => {
  $.module('Router', {
    install(ctx, options) {
      const routeMappings = require('route-mappings');

      ctx.router = routeMappings();

      ctx.mount('router', conn => {
        for (let i = 0; i < ctx.router.routes.length; i += 1) {
          const route = ctx.router.routes[i];

          if (conn.req.method === route.verb && conn.req.url.indexOf(route.path) === 0) {
            return route.callback(conn, options);
          }
        }
      });
    },
  });
};
