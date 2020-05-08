'use strict';

const debug = require('debug')('grown:mount');

module.exports = function $mount(name, handler, callback) {
  /* istanbul ignore else */
  if (typeof name !== 'string') {
    callback = handler;
    handler = name;
    name = null;
  }

  const cb = this._.buildMiddleware(handler, name
    ? `mount.${name}`
    : 'mount');

  /* istanbul ignore else */
  if (name && name.charAt() !== '/') {
    cb.name = `${cb.name}${name}`;
  }

  /* istanbul ignore else */
  if (name && name.charAt() === '/') {
    cb.filter = (ctx, options) => {
      debug('#%s Filter <%s> with url <%s>', ctx.pid, ctx.req.url, name);

      /* istanbul ignore else */
      if (ctx.req.url.indexOf(name) === 0) {
        let url = ctx.req.url;

        if (name !== '/') {
          url = url.replace(name, '') || '/';
        }

        if (url.charAt() !== '/') {
          return false;
        }

        ctx.res._halted = true;
        ctx.req.originalUrl = ctx.req.url;
        ctx.req.baseUrl = name;
        ctx.req.url = url;

        return typeof callback === 'function'
          ? callback(ctx, options)
          : null;
      }

      debug('#%s Skip. Mount path does not match (%s)', ctx.pid, name);

      return false;
    };
  }

  debug('#%s Mounting <%s> handler', process.pid, cb.name);

  this._pipeline.push(cb);
};
