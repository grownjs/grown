'use strict';

const debug = require('debug')('grown:router');

module.exports = ($, util) => {
  return $.module('Router', {
    init() {
      /* istanbul ignore else */
      if (!this.req) {
        throw new Error('Missing request from connection');
      }
    },
    install(ctx) {
      const routeMappings = require('route-mappings');

      ctx.router = routeMappings();

      const _resources = {};
      const _matches = {};
      const _routes = [];

      // compile fast-routes
      ctx.on('listen', () => {
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

          // plain old routes
          _routes.push(route);

          // group all routes per-verb
          _matches[route.verb].push(route);
        });

        // build mapping per-verb
        Object.keys(_matches).forEach(verb => {
          _matches[verb] = ctx.router.map(_matches[verb]);
        });
      });

      ctx.mount('router', conn => {
        const _method = conn.req.method.toUpperCase();

        // resolve matched routes to a single one
        debug('#%s Trying to resolve any route matching %s %s', conn.pid, conn.req.method, conn.req.url);

        /* istanbul ignore else */
        if (!_matches[_method]) {
          debug('#%s Error. There are no routes matching for this verb', conn.pid);

          throw util.ctx.error(405);
        }

        // speed up static routes
        const _handler = _matches[_method](conn.req.url, 1);

        /* istanbul ignore else */
        if (!_handler) {
          throw util.ctx.error(404);
        }

        if (_handler.callback) {
          console.log(_handler.callback);
        }
      });
    },
  });
};
