'use strict';

module.exports = ($, util) => {
  function on(method) {
    return function route(path, cb) {
      if (!(typeof cb === 'function' || Array.isArray(cb))) {
        throw new Error(`Expecting a function or array, given '${cb}'`);
      }

      const _cbs = !Array.isArray(cb)
        ? [cb]
        : cb;

      if (this.router) {
        this.router[method.toLowerCase()](path, {
          pipeline: _cbs,
        });
      } else {
        const _call = util.buildPipeline(path, util.buildMiddleware(_cbs, path));

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
