'use strict';

module.exports = ($, util) => {
  function on(method) {
    return function route(path, cb) {
      util.is(['function', 'array'], cb);

      const _cbs = !Array.isArray(cb)
        ? [cb]
        : cb;

      if (this.router) {
        this.router[method.toLowerCase()](path, {
          pipeline: _cbs,
        });
      } else {
        const _call = util.ctx.pipelineFactory(path, util.ctx.buildPipeline(path, _cbs));

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
