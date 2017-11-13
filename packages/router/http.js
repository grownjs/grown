'use strict';

module.exports = ($, util) => {
  function on(method, callback) {
    return function route(path, cb) {
      if (!(typeof cb === 'function' || Array.isArray(cb))) {
        throw new Error(`Expecting a function or array, given '${JSON.stringify(cb)}'`);
      }

      if (this.router) {
        if (typeof this.router.namespace === 'function') {
          this.router[method.toLowerCase()](path, {
            pipeline: util.flattenArgs(cb),
          });
        } else {
          throw new Error(`Expecting a valid router, given '${this.router}'`);
        }
      } else {
        callback(path, method, util.buildPipeline(path, util.flattenArgs(cb).map(util.buildMiddleware)));
      }

      return this;
    };
  }

  function add(path, method, pipeline) {
    if (!this._routes[method]) {
      this._routes[method] = {};
    }

    this._routes[method][path] = pipeline;
  }

  return $.module('Router.HTTP', {
    install(ctx) {
      this._routes = {};

      util.mergeMethodsInto.call(ctx, ctx, {
        get: on('GET', add.bind(this)),
        put: on('PUT', add.bind(this)),
        post: on('POST', add.bind(this)),
        patch: on('PATCH', add.bind(this)),
        delete: on('DELETE', add.bind(this)),
      });
    },
    call(conn, options) {
      if (!this.router) {
        const routes = this._routes[conn.req.method];
        const pipeline = routes && routes[conn.req.url.split('?')[0]];

        if (routes && pipeline) {
          return pipeline(conn, options);
        }

        throw util.buildError(routes
          ? 404
          : 403);
      }
    },
  });
};
