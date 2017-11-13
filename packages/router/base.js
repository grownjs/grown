'use strict';

const debug = require('debug')('grown:router');

module.exports = ($, util) => {
  function group(ctx) {
    const _mappings = ctx.router.mappings;

    // resolve routing for controllers lookup
    ctx.router.routes.forEach(route => {
      const _handler = route.handler.slice();

      const action = _handler.length > 1 ? _handler.pop() : 'index';
      const controller = _handler.join('.');

      /* istanbul ignore else */
      if (!this[route.verb]) {
        this[route.verb] = [];
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
      this[route.verb].push(route);
    });

    // build mapping per-verb
    Object.keys(this).forEach(verb => {
      this[verb] = ctx.router.map(this[verb]);
    });
  }

  function invoke(conn, options) {
    const _method = conn.req.method;

    // resolve matched routes to a single one
    debug('#%s Trying to resolve any route matching %s %s', conn.pid, conn.req.method, conn.req.url);

    /* istanbul ignore else */
    if (!this[_method]) {
      debug('#%s Error. There are no routes matching for this verb', conn.pid);

      throw util.buildError(405);
    }

    // speed up static routes
    const _handler = this[_method](conn.req.url, 1);

    /* istanbul ignore else */
    if (_handler) {
      /* istanbul ignore else */
      if (typeof _handler.callback !== 'function' && _handler.pipeline) {
        /* istanbul ignore else */
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

  return $.module('Router.Base', {
    install(ctx) {
      const routeMappings = require('route-mappings');

      util.readOnlyProperty(ctx, 'router', routeMappings());

      this._routes = {};

      // compile fast-routes
      ctx.once('start', () =>
        group.call(this._routes, ctx));
    },
    call(conn, options) {
      // match and execute
      return invoke.call(this._routes, conn, options);
    },
  });
};
