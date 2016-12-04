'use strict';

/* eslint-disable global-require */

const STATUS_CODES = require('http').STATUS_CODES;

const pipelineFactory = require('./lib/pipeline');
const buildFactory = require('./lib/factory');

const routeMappings = require('route-mappings');
const glob = require('glob');
const path = require('path');
const fs = require('fs');

const _push = Array.prototype.push;

function _error(code) {
  const message = STATUS_CODES[code];
  const errObj = new Error(message);

  errObj.statusMessage = message;
  errObj.statusCode = code;

  throw errObj;
}

module.exports = (cwd) => {
  /* istanbul ignore else */
  if (typeof cwd !== 'string' || !fs.existsSync(cwd)) {
    throw new Error(`Expecting 'cwd' to be a valid directory, given '${cwd}'`);
  }

  const _routeMappings = require(path.join(cwd, 'config', 'routeMappings.js'));
  const router = _routeMappings(routeMappings);
  const match = {};

  const _urlFor = router.mappings;
  const _controllers = {};
  const _routes = [];

  router.routes.forEach((route) => {
    const _handler = route.handler.slice();

    const action = route._actionName || _handler.pop();
    const controller = route._resourceName || _handler.pop();
    const controllerFile = path.join(cwd, 'controllers', `${controller}Controller.js`);

    /* istanbul ignore else */
    if (!fs.existsSync(controllerFile)) {
      throw new Error(`Missing controller ${controllerFile}`);
    }

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

    const _route = {
      controller,
      action,
      route,
    };

    _routes.push(_route);

    match[route.verb].push(_route);
  });

  Object.keys(match).forEach((verb) => {
    match[verb] = router.map(match[verb]);
  });

  const _middlewaresFile = path.join(cwd, 'config', 'middlewares.js');
  const _middlewares = fs.existsSync(_middlewaresFile) ? require(_middlewaresFile) : {};

  const fixedMiddlewares = {};

  glob.sync('middlewares/**/*.js', { cwd, nodir: true }).forEach((middleware) => {
    const middlewareName = path.basename(middleware.replace(/\/index\.js$/, ''), '.js');

    fixedMiddlewares[middlewareName] = path.join(cwd, middleware);
  });

  function _require(map, options) {
    const list = [];

    map.forEach((name) => {
      if (_middlewares[name]) {
        const _fixedList = Array.isArray(_middlewares[name])
          ? _middlewares[name]
          : [_middlewares[name]];

        _push.apply(list, _require(_fixedList, options));
      } else if (list.indexOf(name) === -1) {
        /* istanbul ignore else */
        if (!fixedMiddlewares[name]) {
          throw new Error(`Undefined '${name}' middleware`);
        }

        const middleware = buildFactory(require(fixedMiddlewares[name]), options, name);

        list.push({
          name: middleware.name || name,
          call: middleware.call,
          type: 'function',
        });
      }
    }, this);

    return list;
  }

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

        tasks.push({
          name: `${handler.controller}.${task}`,
          call: [_controllers[handler.controller].instance, task],
          type: 'method',
        });
      });
    }

    return tasks;
  }

  return (container) => {
    const _map = container.extensions.routes = router.mappings;

    _map.forEach = Array.prototype.forEach.bind(_routes);
    _map.map = Array.prototype.map.bind(_routes);

    function run(conn, _options) {
      const _method = conn.req.method.toLowerCase();

      /* istanbul ignore else */
      if (!match[_method]) {
        return _error(405);
      }

      const _handler = match[_method](conn.req.url, 1);

      if (_handler) {
        container.extensions.params = conn.params = {};
        container.extensions.handler = conn.handler = _handler;

        /* istanbul ignore else */
        if (_handler.matcher && _handler.matcher.keys) {
          _handler.matcher.keys.forEach((key, i) => {
            conn.params[key] = _handler.matcher.values[i];
          });
        }

        let Controller = _controllers[_handler.controller].original;

        /* istanbul ignore else */
        if (!Controller) {
          Controller
            = _controllers[_handler.controller].original
            = require(_controllers[_handler.controller].filepath);

          const isClass =
            typeof Controller === 'function'
            && Controller.constructor && Controller.name;

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

          _push.apply(_pipeline, _pipe(Controller.pipeline, _handler));

          _pipeline.push({
            name: `${_handler.controller}.${_handler.action}`,
            call: [controllerInstance, _handler.action],
            type: 'method',
          });

          _pipeline = pipelineFactory('router', _pipeline);

          _controllers[_handler.controller].pipeline[_handler.action] = _pipeline;
        }

        if (Controller.inject) {
          Object.keys(Controller.inject).forEach((key) => {
            conn[key] = Controller.inject[key](conn, _options);
          });
        }

        return _pipeline(conn, _options);
      }

      return _error(404);
    }

    container._context.mount((conn, _options) => {
      return conn.next(() => {
        /* istanbul ignore else */
        if (conn.body === null) {
          return run(conn, _options);
        }
      });
    });
  };
};
