'use strict';

/* eslint-disable global-require */
/* eslint-disable prefer-rest-params */

const pipelineFactory = require('../pipeline');
const buildFactory = require('../factory');

const glob = require('glob');
const path = require('path');
const fs = require('fs');

const _push = Array.prototype.push;

module.exports = function routerPlugin() {
  const args = Array.prototype.slice.call(arguments);

  const RouteMappings = require('route-mappings');
  const objectNew = require('object-new');

  const router = new RouteMappings();
  const match = {};

  const _fixedMiddlewares = {};
  const _middlewares = {};

  const _controllers = {};
  const _routes = [];

  // reduce middleware chain into a single pipeline
  function _require(map, options) {
    const list = [];

    map.forEach((name) => {
      /* istanbul ignore else */
      if (_middlewares[name]) {
        const _fixedList = Array.isArray(_middlewares[name])
          ? _middlewares[name]
          : [_middlewares[name]];

        // recursively flatten nested middleware
        _push.apply(list, _require(_fixedList, options));
      } else if (list.indexOf(name) === -1) {
        /* istanbul ignore else */
        if (!_fixedMiddlewares[name]) {
          throw new Error(`Undefined '${name}' middleware`);
        }

        // normalize required middleware module
        let _middleware = require(_fixedMiddlewares[name]);

        /* istanbul ignore else */
        if (typeof _middleware === 'function') {
          _middleware = _middleware(options);
        }

        const middleware = buildFactory(_middleware, options, name);

        // push task to pipeline
        list.push({
          name: middleware.name || name,
          call: middleware.call,
          type: middleware.type || 'function',
        });
      }
    }, this);

    return list;
  }

  // action-specific pipeline
  function _pipe(from, handler) {
    const tasks = [];

    /* istanbul ignore else */
    if (from && from[handler.action]) {
      const _fixedPipe = Array.isArray(from[handler.action])
        ? from[handler.action]
        : [from[handler.action]];

      _fixedPipe.forEach((task) => {
        /* istanbul ignore else */
        if (!_controllers[handler.controller].instance[task]) {
          throw new Error(`Undefined '${handler.controller}.${task}' handler`);
        }

        // all calls are methods
        tasks.push({
          name: `${handler.controller}.${task}`,
          call: [_controllers[handler.controller].instance, task],
          type: 'method',
        });
      });
    }

    return tasks;
  }

  args.forEach((cwd) => {
    /* istanbul ignore else */
    if (typeof cwd !== 'string' || !fs.existsSync(cwd)) {
      throw new Error(`Expecting 'cwd' to be a valid directory, given '${cwd}'`);
    }

    const _routeMappings = path.join(cwd, 'config', 'routes.js');

    if (fs.existsSync(_routeMappings)) {
      const routeMappings = require(_routeMappings);
      const _router = routeMappings(new RouteMappings({ cwd }));

      router.namespace('/', _router);
    }

    // load global middleware definitions
    const _middlewaresFile = path.join(cwd, 'config', 'middlewares.js');

    const middlewares = fs.existsSync(_middlewaresFile) ? require(_middlewaresFile) : {};

    Object.keys(middlewares).forEach((middleware) => {
      _middlewares[middleware] = middlewares[middleware];
    });

    // load all available middleware references, override later
    glob.sync('middlewares/**/*.js', { cwd, nodir: true }).forEach((middleware) => {
      const middlewareName = path.basename(middleware.replace(/\/index\.js$/, ''), '.js');

      // the middleware is stored by name
      _fixedMiddlewares[middlewareName] = path.join(cwd, middleware);
    });
  });

  // resolve routing for controllers lookup
  router.routes.forEach((route) => {
    const _handler = route.handler.slice();

    // normalize the action/controller
    const action = route._actionName || _handler.pop();
    const controller = route._resourceName || _handler.pop();
    const controllerFile = path.join(route.cwd, 'controllers', `${controller}.js`);

    /* istanbul ignore else */
    if (!fs.existsSync(controllerFile)) {
      throw new Error(`Missing controller ${controllerFile}`);
    }

    // memoize reference
    _controllers[controller] = {
      filepath: controllerFile,
      pipeline: {},
    };

    /* istanbul ignore else */
    if (!match[route.verb]) {
      match[route.verb] = [];
    }

    /* istanbul ignore else */
    if (route.middleware && !Array.isArray(route.middleware)) {
      route.middleware = [route.middleware];
    }

    // route definition
    const _route = {
      controller,
      action,
      route,
    };

    // plain old routes
    _routes.push(_route);

    // group all routes per-verb
    match[route.verb].push(_route);
  });

  // build mapping per-verb
  Object.keys(match).forEach((verb) => {
    match[verb] = router.map(match[verb]);
  });

  return ($, util) => {
    const statusErr = util.statusErr;
    const reduce = util.reduce;
    const methods = util.methods;

    // public API
    $.extensions.routes = router.mappings;
    $.extensions.routes.map = Array.prototype.map.bind(_routes);
    $.extensions.routes.forEach = Array.prototype.forEach.bind(_routes);

    // controller holder
    $.extensions.controllers = {};

    // caching
    const _cache = {};

    function run(conn, _options) {
      const _method = conn.req.method.toLowerCase();

      /* istanbul ignore else */
      if (!match[_method]) {
        throw statusErr(405);
      }

      // resolve matched routes to a single one
      const _base = conn.req.url.split('?')[0];

      // speed up static routes
      const _handler = _cache[`${conn.req.method} ${_base}`]
        || (_cache[`${conn.req.method} ${_base}`] = match[_method](conn.req.url, 1));

      if (_handler) {
        $.extensions.params = conn.req.params = {};
        $.extensions.handler = conn.req.handler = _handler;

        /* istanbul ignore else */
        if (_handler.matcher && _handler.matcher.keys) {
          _handler.matcher.keys.forEach((key, i) => {
            $.extensions.params[key] = _handler.matcher.values[i];
          });
        }

        // read from memory first
        let Controller = _controllers[_handler.controller].original;

        /* istanbul ignore else */
        if (!Controller) {
          // lazily load and set the original module
          Controller
            = _controllers[_handler.controller].original
            = require(_controllers[_handler.controller].filepath);

          // object-new support
          if (typeof Controller.init === 'function' || Controller.methods) {
            Controller = objectNew(_handler.controller, Controller, $.extensions.controllers);
          } else {
            $.extensions.controllers[_handler.controller] = Controller;
          }

          // using classes?
          const isClass =
            typeof Controller === 'function'
            && Controller.constructor && Controller.name;

          // class-like constructors are always instantiated
          _controllers[_handler.controller].instance = isClass ? new Controller() : Controller;
        }

        const controllerInstance = _controllers[_handler.controller].instance;

        /* istanbul ignore else */
        if (!controllerInstance[_handler.action]) {
          throw new Error(`Undefined '${_handler.controller}.${_handler.action}' handler`);
        }

        let _pipeline = _controllers[_handler.controller].pipeline[_handler.action];

        /* istanbul ignore else */
        if (!_pipeline) {
          _pipeline = [];

          /* istanbul ignore else */
          if (Array.isArray(_handler.route.middleware)) {
            _push.apply(_pipeline, _require(_handler.route.middleware, _options));
          }

          // dependency injection support
          _pipeline.push({
            name: '$',
            call(_conn) {
              /* istanbul ignore else */
              if (Controller.inject) {
                return reduce(Controller.inject, cb => cb(conn, _options))
                  .then((deps) => {
                    methods(_conn, deps);
                  });
              }
            },
            type: 'function',
          });

          // controller-specific pipeline
          _push.apply(_pipeline, _pipe(Controller.pipeline, _handler));

          // our final action
          _pipeline.push({
            name: `${_handler.controller}.${_handler.action}`,
            call: [controllerInstance, _handler.action],
            type: 'method',
          });

          // compile the pipeline
          _pipeline = pipelineFactory('router', _pipeline);

          // memoize
          _controllers[_handler.controller].pipeline[_handler.action] = _pipeline;
        }

        // store instantiated handler reference
        _handler._controller = _controllers[_handler.controller];

        // execute
        return _pipeline(conn, _options);
      }

      throw statusErr(404);
    }

    $.ctx.mount('router', (conn, _options) =>
      conn.next(() => conn.resp_body === null && run(conn, _options)));
  };
};
