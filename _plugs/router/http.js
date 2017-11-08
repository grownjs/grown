'use strict';

function on(method, opts) {
  return function route(path, cb) {
    if (typeof cb !== 'function') {
      throw new Error(`Expecting a valid callback, given '${cb}'`);
    }

    if (this.router) {
      this.router[method.toLowerCase()](path, {
        callback: cb,
      });
    } else {
      this.mount(path, conn => {
        if (conn.req.method === method) {
          return cb(conn, opts);
        }
      });
    }

    return this;
  };
}

module.exports = ($, opts) => {
  $.module('Router.HTTP', {
    get: on('GET', opts),
    put: on('PUT', opts),
    post: on('POST', opts),
    patch: on('PATCH', opts),
    delete: on('DELETE', opts),
  });
};
