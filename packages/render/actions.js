'use strict';

// TODO: this module will be responsible of rendering any kind of resources
// through the system, e.g. controllers, model resources, etc.
// it should render only those handlers without render calls?

module.exports = ($, util) => {
  function _renderAction(e, conn) {
    if (conn.req.handler.resource) {
      conn.resp_body = this.partial('resource/example', conn.state);
    }

    if (conn.req.handler.controller) {
      console.log('CTRL', conn.req.handler.controller, conn.req.handler.action);
    }
  }

  return $.module('Render.Actions', {
    before_send: _renderAction,

    install() {
      if (!this._partial) {
        throw new Error('Render.Layout depends on Render.Views, please include within');
      }
    },
  });
};
