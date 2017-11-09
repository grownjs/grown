'use strict';

const debug = require('debug')('grown:router');

module.exports = ($, util) => {
  function group(ctx, _routes, _matches, _resources) {
    const _mappings = ctx.router.mappings;

    // resolve routing for controllers lookup
    ctx.router.routes.forEach(route => {
      const _handler = route.handler.slice();

      const action = _handler.length > 1 ? _handler.pop() : 'index';
      const controller = _handler.join('.');

      /* istanbul ignore else */
      if (!_matches[route.verb]) {
        _matches[route.verb] = [];
      }

      /* istanbul ignore else */
      if (route.use && !Array.isArray(route.use)) {
        route.use = [route.use];
      }

      // route definition
      route.controller = controller;
      route.action = action;

      /* istanbul ignore else */
      if (route.resource && !_resources[route.resource]) {
        _resources[route.resource] = _mappings(route.controller);
      }

      delete route.handler;

      /* istanbul ignore else */
      if (route.pipeline) {
        route.pipeline = util.ctx.buildPipeline(route.as, route.pipeline);
      }

      // plain old routes
      _routes.push(route);

      // group all routes per-verb
      _matches[route.verb].push(route);
    });

    // build mapping per-verb
    Object.keys(_matches).forEach(verb => {
      _matches[verb] = ctx.router.map(_matches[verb]);
    });
  }

  function invoke(conn, options) {
    const _method = conn.req.method.toUpperCase();

    // resolve matched routes to a single one
    debug('#%s Trying to resolve any route matching %s %s', conn.pid, conn.req.method, conn.req.url);

    /* istanbul ignore else */
    if (!this[_method]) {
      debug('#%s Error. There are no routes matching for this verb', conn.pid);

      throw util.ctx.error(405);
    }

    // speed up static routes
    const _handler = this[_method](conn.req.url, 1);

    /* istanbul ignore else */
    if (_handler) {
      /* istanbul ignore else */
      if (typeof _handler.callback !== 'function' && _handler.pipeline) {
        _handler.callback = util.ctx.pipelineFactory(_handler.path, _handler.pipeline);
      }

      /* istanbul ignore else */
      if (!_handler.callback) {
        throw new Error(`No callback found for ${_handler.path}`);
      }

      return _handler.callback(conn, options);
    }

    throw util.ctx.error(404);
  }

  return $.module('Router', {
    init() {
      /* istanbul ignore else */
      if (!this.req) {
        throw new Error('Request is missing from connection');
      }
    },
    install(ctx, options) {
      const routeMappings = require('route-mappings');

      ctx.router = routeMappings();

      const _resources = {};
      const _matches = {};
      const _routes = [];

      // compile fast-routes
      ctx.on('listen', () =>
        group(ctx, _routes, _matches, _resources));

      // match and execute
      ctx.mount('router', conn => invoke.call(_matches, conn, options));
    },
  });
};
