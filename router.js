/* eslint-disable global-require */

var Homegrown = require('./lib/api');

var STATUS_CODES = require('http').STATUS_CODES;

var routeMappings = require('route-mappings');
var glob = require('glob');
var path = require('path');
var fs = require('fs');

var _push = Array.prototype.push;

function _error(code) {
  var message = STATUS_CODES[code];
  var errObj = new Error(message);

  errObj.statusMessage = message;
  errObj.statusCode = code;

  throw errObj;
}

module.exports = function (cwd) {
  /* istanbul ignore else */
  if (typeof cwd !== 'string' || !fs.existsSync(cwd)) {
    throw new Error(("Expecting 'cwd' to be a valid directory, given '" + cwd + "'"));
  }

  var _routeMappings = require(path.join(cwd, 'config', 'routeMappings.js'));
  var router = _routeMappings(routeMappings);
  var match = {};

  var _controllers = {};
  var _routes = [];

  router.routes.forEach(function (route) {
    var _handler = route.handler.slice();

    var action = route._actionName || _handler.pop();
    var controller = route._resourceName || _handler.pop();
    var controllerFile = path.join(cwd, 'controllers', (controller + "Controller.js"));

    /* istanbul ignore else */
    if (!fs.existsSync(controllerFile)) {
      throw new Error(("Missing controller " + controllerFile));
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

    var _route = {
      controller: controller,
      action: action,
      route: route,
    };

    _routes.push(_route);

    match[route.verb].push(_route);
  });

  Object.keys(match).forEach(function (verb) {
    match[verb] = router.map(match[verb]);
  });

  var _middlewaresFile = path.join(cwd, 'config', 'middlewares.js');
  var _middlewares = fs.existsSync(_middlewaresFile) ? require(_middlewaresFile) : {};

  var fixedMiddlewares = {};

  glob.sync('middlewares/**/*.js', { cwd: cwd, nodir: true }).forEach(function (middleware) {
    var middlewareName = path.basename(middleware.replace(/\/index\.js$/, ''), '.js');

    fixedMiddlewares[middlewareName] = path.join(cwd, middleware);
  });

  function _require(map, options) {
    var list = [];

    map.forEach(function (name) {
      if (_middlewares[name]) {
        var _fixedList = Array.isArray(_middlewares[name])
          ? _middlewares[name]
          : [_middlewares[name]];

        _push.apply(list, _require(_fixedList, options));
      } else if (list.indexOf(name) === -1) {
        /* istanbul ignore else */
        if (!fixedMiddlewares[name]) {
          throw new Error(("Undefined '" + name + "' middleware"));
        }

        var middleware = Homegrown.chain.factory(require(fixedMiddlewares[name]), options, name);

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
    var tasks = [];

    /* istanbul ignore else */
    if (from && from[handler.action]) {
      var _fixedPipe = Array.isArray(from[handler.action])
        ? from[handler.action]
        : [from[handler.action]];

      _fixedPipe.forEach(function (task) {
        /* istanbul ignore else */
        if (!_controllers[handler.controller].instance[task]) {
          throw new Error(("Undefined '" + (handler.controller) + "." + task + "' handler"));
        }

        tasks.push({
          name: ((handler.controller) + "." + task),
          call: [_controllers[handler.controller].instance, task],
          type: 'method',
        });
      });
    }

    return tasks;
  }

  return function ($) {
    var _map = $.extensions.routes = router.mappings;

    _map.forEach = Array.prototype.forEach.bind(_routes);
    _map.map = Array.prototype.map.bind(_routes);

    function run(conn, _options) {
      var _method = conn.req.method.toLowerCase();

      /* istanbul ignore else */
      if (!match[_method]) {
        return _error(405);
      }

      var _handler = match[_method](conn.req.url, 1);

      if (_handler) {
        $.extensions.params = conn.req.params = {};
        $.extensions.handler = conn.req.handler = _handler;

        /* istanbul ignore else */
        if (_handler.matcher && _handler.matcher.keys) {
          _handler.matcher.keys.forEach(function (key, i) {
            $.extensions.params[key] = _handler.matcher.values[i];
          });
        }

        var Controller = _controllers[_handler.controller].original;

        /* istanbul ignore else */
        if (!Controller) {
          Controller
            = _controllers[_handler.controller].original
            = require(_controllers[_handler.controller].filepath);

          var isClass =
            typeof Controller === 'function'
            && Controller.constructor && Controller.name;

          _controllers[_handler.controller].instance = isClass ? new Controller() : Controller;
        }

        var controllerInstance = _controllers[_handler.controller].instance;

        /* istanbul ignore else */
        if (!controllerInstance[_handler.action]) {
          throw new Error(("Undefined '" + (_handler.controller) + "." + (_handler.action) + "' handler"));
        }

        var _pipeline = _controllers[_handler.controller].pipeline[_handler.action];

        /* istanbul ignore else */
        if (!_pipeline) {
          _pipeline = [];

          /* istanbul ignore else */
          if (Array.isArray(_handler.route.middleware)) {
            _push.apply(_pipeline, _require(_handler.route.middleware, _options));
          }

          _push.apply(_pipeline, _pipe(Controller.pipeline, _handler));

          _pipeline.push({
            name: ((_handler.controller) + "." + (_handler.action)),
            call: [controllerInstance, _handler.action],
            type: 'method',
          });

          _pipeline = Homegrown.chain.pipeline('router', _pipeline);

          _controllers[_handler.controller].pipeline[_handler.action] = _pipeline;
        }

        if (Controller.inject) {
          Object.keys(Controller.inject).forEach(function (key) {
            conn[key] = Controller.inject[key](conn, _options);
          });
        }

        _handler._controller = _controllers[_handler.controller];

        return _pipeline(conn, _options);
      }

      return _error(404);
    }

    $.ctx.mount(function (conn, _options) { return conn.next(function () {
        /* istanbul ignore else */
        if (conn.resp_body === null) {
          return run(conn, _options);
        }
      }); });
  };
};
