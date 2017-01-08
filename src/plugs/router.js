/* eslint-disable global-require */

const pipelineFactory = require('../pipeline');
const buildFactory = require('../factory');

const { statusErr, reduce, methods } = require('../util');

const glob = require('glob');
const path = require('path');
const fs = require('fs');

const _push = Array.prototype.push;

module.exports = (cwd) => {
  /* istanbul ignore else */
  if (typeof cwd !== 'string' || !fs.existsSync(cwd)) {
    throw new Error(`Expecting 'cwd' to be a valid directory, given '${cwd}'`);
  }

  const RouteMappings = require('route-mappings');

  const routeMappings = require(path.join(cwd, 'config', 'routeMappings.js'));
  const router = routeMappings(RouteMappings);
  const match = {};

  const _controllers = {};
  const _routes = [];

  // resolve routing for controllers lookup
  router.routes.forEach((route) => {
    const _handler = route.handler.slice();

    // normalize the action/controller
    const action = route._actionName || _handler.pop();
    const controller = route._resourceName || _handler.pop();
    const controllerFile = path.join(cwd, 'controllers', `${controller}Controller.js`);

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

  // load global middleware definitions
  const _middlewaresFile = path.join(cwd, 'config', 'middlewares.js');
  const _middlewares = fs.existsSync(_middlewaresFile) ? require(_middlewaresFile) : {};

  const fixedMiddlewares = {};

  // load all available middleware references, override later
  glob.sync('middlewares/**/*.js', { cwd, nodir: true }).forEach((middleware) => {
    const middlewareName = path.basename(middleware.replace(/\/index\.js$/, ''), '.js');

    // the middleware is stored by name
    fixedMiddlewares[middlewareName] = path.join(cwd, middleware);
  });

  // reduce middleware chain into a single pipeline
  function _require(map, options) {
    const list = [];

    map.forEach((name) => {
      if (_middlewares[name]) {
        const _fixedList = Array.isArray(_middlewares[name])
          ? _middlewares[name]
          : [_middlewares[name]];

        // recursively flatten nested middleware
        _push.apply(list, _require(_fixedList, options));
      } else if (list.indexOf(name) === -1) {
        /* istanbul ignore else */
        if (!fixedMiddlewares[name]) {
          throw new Error(`Undefined '${name}' middleware`);
        }

        // normalize required middleware module
        const middleware = buildFactory(require(fixedMiddlewares[name]), options, name);

        // push task to pipeline
        list.push({
          name: middleware.name || name,
          call: middleware.call,
          type: 'function',
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

  return ($) => {
    // public API
    $.extensions.routes = router.mappings;
    $.extensions.routes.map = Array.prototype.map.bind(_routes);
    $.extensions.routes.forEach = Array.prototype.forEach.bind(_routes);

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
