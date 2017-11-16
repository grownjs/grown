'use strict';

const debug = require('debug')('grown:router');

module.exports = ($, util) => {
  function on(ctx, method) {
    return function route(path, cb) {
      if (!(typeof cb === 'function' || Array.isArray(cb))) {
        throw new Error(`Expecting a function or array, given '${JSON.stringify(cb)}'`);
      }

      if (typeof ctx.router.namespace === 'function') {
        ctx.router[method.toLowerCase()](path, {
          pipeline: util.flattenArgs(cb),
        });
      } else {
        throw new Error(`Expecting a valid router, given '${ctx.router}'`);
      }

      return ctx;
    };
  }

  function group(ctx) {
    const _mappings = ctx.router.mappings;
    const _routes = {};

    // resolve routing for controllers lookup
    ctx.router.routes.forEach(route => {
      const _handler = route.handler.slice();

      const action = _handler.length > 1 ? _handler.pop() : 'index';
      const controller = _handler.join('.');

      /* istanbul ignore else */
      if (!_routes[route.verb]) {
        _routes[route.verb] = [];
      }

      /* istanbul ignore else */
      if (route.use && !Array.isArray(route.use)) {
        route.use = [route.use];
      }

      // route definition
      route.controller = controller;
      route.action = action;

      delete route.handler;

      // group all routes per-verb
      _routes[route.verb].push(route);
    });

    // build mapping per-verb
    Object.keys(_routes).forEach(verb => {
      _routes[verb] = ctx.router.map(_routes[verb]);
    });

    return _routes;
  }

  function invoke(conn, options) {
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
      if (typeof _handler.callback !== 'function' && _handler.pipeline) {
        _handler.callback = util.buildPipeline(_handler.path,
          _handler.pipeline.map(x => util.buildMiddleware(x, _handler.as)));
      }

      /* istanbul ignore else */
      if (!_handler.callback) {
        throw new Error(`No callback found for ${_handler.path}`);
      }

      conn.req.params = conn.req.params || {};

      _handler.matcher.keys.forEach((key, i) => {
        conn.req.params[key] = _handler.matcher.values[i];
      });

      return _handler.callback(conn, options);
    }

    throw util.buildError(404);
  }

  return $.module('Router.Mappings', {
    install(ctx) {
      const routeMappings = require('route-mappings');

      util.readOnlyProperty(ctx, 'router', routeMappings());

      ctx.once('start', () => {
        // compile fast-routes
        this._routes = group(ctx);
      });

      return {
        methods: {
          get: on(ctx, 'GET'),
          put: on(ctx, 'PUT'),
          post: on(ctx, 'POST'),
          patch: on(ctx, 'PATCH'),
          delete: on(ctx, 'DELETE'),
        },
      };
    },

    call(conn, options) {
      try {
        // match and execute
        return invoke.call(this, conn, options);
      } catch (e) {
        /* istanbul ignore else */
        if (!this.fallthrough) {
          throw e;
        }
      }
    },
  });
};
