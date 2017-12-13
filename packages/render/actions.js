'use strict';

module.exports = Grown => {
  return Grown.module('Render.Actions', {
    install(ctx) {
      ctx.mount('Render.Actions#pipe', conn => {
        if (conn.req.handler.resource) {
          conn.render(`resource/${conn.req.handler.action || 'show'}`, conn.state);
        }

        if (conn.req.handler.controller) {
          conn.render(`views/${conn.req.handler.controller}/${conn.req.handler.action || 'show'}`, conn.state);
        }
      });
    },
  });
};
