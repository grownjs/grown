'use strict';

function on(method) {
  return function route(path, cb) {
    if (typeof cb !== 'function') {
      throw new Error(`Expecting a valid callback, given '${cb}'`);
    }

    if (this.router) {
      this.router[method.toLowerCase()](path, {
        callback: cb,
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

module.exports = $ => {
  $.module('Router.HTTP', {
    get: on('GET'),
    put: on('PUT'),
    post: on('POST'),
    patch: on('PATCH'),
    delete: on('DELETE'),
  });
};
