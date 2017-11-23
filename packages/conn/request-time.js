'use strict';

module.exports = Grown => {
  return Grown.module('Conn.RequestTime', {
    _elapsedTime() {
      return ((new Date()) - this._startTime) / 1000;
    },

    before_render(ctx, template) {
      if (template.contents.indexOf('{elapsed}') === -1) {
        template.contents += `Time: ${this._elapsedTime()}ms.`;
      } else {
        template.contents = template.contents.replace(/\{elapsed\}/g, this._elapsedTime());
      }
    },

    before_send(e, ctx) {
      if (typeof ctx.end === 'function') {
        ctx.put_resp_header('X-Response-Time', this._elapsedTime());
      } else if (ctx.res) {
        ctx.res.setHeader('X-Response-Time', this._elapsedTime());
      }
    },

    install(ctx) {
      ctx.on('request', () => {
        this._startTime = new Date();
      });
    },
  });
};
