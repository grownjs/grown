'use strict';

const debug = require('debug')('grown:router');

module.exports = ($, util) => {
  function _fixMethod(ctx, method) {
    return function route(path, cb) {
      const opts = {};

      if (typeof cb === 'function' || Array.isArray(cb)) {
        opts.pipeline = util
          .flattenArgs(Array.prototype.slice.call(arguments, 1))
          .map(x => util.buildMiddleware(x, path));
      } else if (typeof cb === 'string') {
        opts.to = cb;
      } else {
        util.extendValues(opts, cb);
      }

      if (typeof ctx.router.namespace === 'function') {
        ctx.router[method.toLowerCase()](path, opts);
      } else {
        throw new Error(`Expecting a valid router, given '${ctx.router}'`);
      }

      return ctx;
    };
  }

  function _dispatchRoutes(conn, options) {
    const _method = conn.req.method;

    // resolve matched routes to a single one
    debug('#%s Trying to resolve any route matching %s %s', conn.pid, conn.req.method, conn.req.url);

    /* istanbul ignore else */
    if (!this._routes[_method]) {
      debug('#%s Error. There are no routes matching for this verb', conn.pid);

      throw util.buildError(405);
    }

    // speed up static routes
    const _handler = this._routes[_method](conn.req.url, 1);

    /* istanbul ignore else */
    if (_handler) {
      /* istanbul ignore else */
      if (!_handler.pipeline) {
        throw new Error(`Missing pipeline, given '${util.inspect(_handler)}'`);
      }

      /* istanbul ignore else */
      if (typeof _handler.callback !== 'function') {
        _handler.callback = util.buildPipeline(_handler.path, _handler.pipeline);
      }

      conn.req.params = conn.req.params || {};

      _handler.matcher.keys.forEach((key, i) => {
        conn.req.params[key] = _handler.matcher.values[i];
      });

      return _handler.callback(conn, options);
    }

    throw util.buildError(404);
  }

  function _groupRoutes(ctx) {
    this._routes = Object.create(null);

    const _routes = ctx.router.routes;

    return ctx.emit('before_routes', ctx, _routes)
      .then(() => {
        // resolve routing for controllers lookup
        _routes.forEach(route => {
          /* istanbul ignore else */
          if (!this._routes[route.verb]) {
            this._routes[route.verb] = [];
          }

          // group all routes per-verb
          this._routes[route.verb].push(route);
        });

        // build mapping per-verb
        Object.keys(this._routes).forEach(verb => {
          this._routes[verb] = ctx.router.map(this._routes[verb]);
        });
      });
  }

  return $.module('Router.Mappings', {
    _dispatchRoutes,
    _groupRoutes,
    _fixMethod,

    install(ctx) {
      const routeMappings = require('route-mappings');

      util.readOnlyProperty(ctx, 'router', routeMappings());

      // compile fast-routes
      ctx.once('start', () => this._groupRoutes(ctx));

      ctx.mount((conn, options) => {
        try {
          // match and execute
          return this._dispatchRoutes(conn, options);
        } catch (e) {
          /* istanbul ignore else */
          if (!this.fallthrough) {
            throw e;
          }
        }
      });

      return {
        methods: {
          get: this._fixMethod(ctx, 'GET'),
          put: this._fixMethod(ctx, 'PUT'),
          post: this._fixMethod(ctx, 'POST'),
          patch: this._fixMethod(ctx, 'PATCH'),
          delete: this._fixMethod(ctx, 'DELETE'),
        },
      };
    },
  });
};
