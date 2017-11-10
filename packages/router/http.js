'use strict';

module.exports = ($, util) => {
  function on(method) {
    return function route(path, cb) {
      if (!(typeof cb === 'function' || Array.isArray(cb))) {
        throw new Error(`Expecting a function or array, given '${JSON.stringify(cb)}'`);
      }

      if (this.router) {
        this.router[method.toLowerCase()](path, {
          pipeline: util.flattenArgs(cb),
        });
      } else {
        const _call = util.buildPipeline(path, util.flattenArgs(cb).map(util.buildMiddleware));

        this.mount(path, (conn, options) => {
          if (conn.req.method === method) {
            return _call(conn, options);
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
