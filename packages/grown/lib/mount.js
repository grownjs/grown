'use strict';

const debug = require('debug')('grown:mount');

const buildMiddleware = require('./plug/middleware');

module.exports = function $mount(name, handler, callback) {
  /* istanbul ignore else */
  if (typeof name !== 'string') {
    callback = handler;
    handler = name;
    name = null;
  }

  const cb = buildMiddleware(handler, name
    ? `mount.${name}`
    : 'mount');

  /* istanbul ignore else */
  if (name && (cb.name === '?' || cb.name === '*')) {
    cb.name = `${name}${cb.name}`;
  }

  /* istanbul ignore else */
  if (name && name.charAt() === '/') {
    cb.filter = (ctx, options) => {
      /* istanbul ignore else */
      if (ctx.req.url.indexOf(name) === 0) {
        return typeof callback === 'function'
          ? callback(ctx, options)
          : null;
      }

      debug('#%s Skip. Mount path does not match (%s)', ctx.pid, name);

      return false;
    };
  }

  debug('Mounting <%s> handler', cb.name);

  this._pipeline.push(cb);
};
