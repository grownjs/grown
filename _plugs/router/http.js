'use strict';

module.exports = ($, util) => {
  function on(method) {
    return function route(path, cb) {
      util.is(['function', 'array'], cb);

      if (this.router) {
        this.router[method.toLowerCase()](path, {
          pipeline: !Array.isArray(cb)
            ? [cb]
            : cb,
        });
      } else {
        this.mount(path, (conn, options) => {
          if (conn.req.method === method) {
            return cb(conn, options);
          }
        });
      }

      return this;
    };
  }

  return $.module('Router.HTTP', {
    get: on('GET'),
    put: on('PUT'),
    post: on('POST'),
    patch: on('PATCH'),
    delete: on('DELETE'),
  });
};
