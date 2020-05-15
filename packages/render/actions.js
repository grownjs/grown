'use strict';

module.exports = Grown => {
  return Grown('Render.Actions', {
    $install(ctx) {
      if (!this._buildvNode) {
        throw new Error('Render.Actions depends on Render.Views, please include within');
      }

      ctx.mount('Render.Actions#pipe', conn => {
        if (conn.req.handler
          && conn.req.handler.Controller
          && conn.req.handler.Controller.layout !== false) {
          if (conn.req.handler.resource) {
            conn.render(`resource/${conn.req.handler.action || 'show'}`, conn.state);
          }

          if (conn.req.handler.controller) {
            conn.render(`views/${conn.req.handler.controller}/${conn.req.handler.action || 'show'}`, conn.state);
          }
        }
      });
    },
  });
};
