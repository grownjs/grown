var STATUS_CODES = require('http').STATUS_CODES;

var pipelineFactory = require('./pipeline');
var buildFactory = require('./factory');

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
    throw new Error('Expecting `cwd` to be a valid directory, given `' + cwd + '`');
  }

  var _routeMappings = require(path.join(cwd, 'config', 'routeMappings.js'));
  var router = _routeMappings(routeMappings);
  var match = {};

  var _controllers = {};
  var _routes = [];

  router.routes.forEach(function (route) {
    var _handler = route.handler.slice().concat(route.to ? [route.to] : []);

    _handler = _handler.join('.').split('.');

    var controller = _handler[0];
    var action = _handler[1] || route.action;

    var controllerFile = path.join(cwd, 'controllers', controller + 'Controller.js');

    /* istanbul ignore else */
    if (!fs.existsSync(controllerFile)) {
      throw new Error('Missing controller ' + controllerFile);
    }

    _controllers[controller] = {
      filepath: controllerFile,
      pipeline: {}
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
      route: route
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
        var _fixedList = Array.isArray(_middlewares[name]) ? _middlewares[name] : [_middlewares[name]];

        _push.apply(list, _require(_fixedList, options));
      } else if (list.indexOf(name) === -1) {
        /* istanbul ignore else */
        if (!fixedMiddlewares[name]) {
          throw new Error('Undefined `' + name + '` middleware');
        }

        var middleware = buildFactory(require(fixedMiddlewares[name]), options, name);

        list.push({
          name: middleware.name || name,
          call: middleware.call,
          type: 'function'
        });
      }
    }, this);

    return list;
  }

  function _pipe(from, handler) {
    var tasks = [];

    /* istanbul ignore else */
    if (from && from[handler.action]) {
      var _fixedPipe = Array.isArray(from[handler.action]) ? from[handler.action] : [from[handler.action]];

      _fixedPipe.forEach(function (task) {
        /* istanbul ignore else */
        if (!_controllers[handler.controller].instance[task]) {
          throw new Error('Undefined `' + handler.controller + '.' + task + '` handler');
        }

        tasks.push({
          name: handler.controller + '.' + task,
          call: [_controllers[handler.controller].instance, task],
          type: 'method'
        });
      });
    }

    return tasks;
  }

  return function (server, container) {
    container.extensions.routes = router.mappings;
    container.extensions.routes.forEach = Array.prototype.forEach.bind(_routes);

    function run(conn, _options) {
      var _method = conn.req.method.toLowerCase();
      var handler;

      /* istanbul ignore else */
      if (!match[_method]) {
        return _error(405);
      }

      if (match[_method] && (handler = match[_method](conn.req.url, 1))) {
        conn.req.handler = handler;
        conn.req.params = {};

        /* istanbul ignore else */
        if (handler.matcher && handler.matcher.keys) {
          handler.matcher.keys.forEach(function(key, i) {
            conn.req.params[key] = handler.matcher.values[i];
          });
        }

        var Controller = _controllers[handler.controller].original;

        /* istanbul ignore else */
        if (!Controller) {
          Controller = _controllers[handler.controller].original = require(_controllers[handler.controller].filepath);

          var isClass = typeof Controller === 'function' && Controller.constructor && Controller.name;

          _controllers[handler.controller].instance = isClass ? new Controller() : Controller;
        }

        var controllerInstance = _controllers[handler.controller].instance;

        /* istanbul ignore else */
        if (!controllerInstance[handler.action]) {
          throw new Error('Undefined `' + handler.controller + '.' + handler.action + '` handler');
        }

        var _pipeline = _controllers[handler.controller].pipeline[handler.action];

        /* istanbul ignore else */
        if (!_pipeline) {
          _pipeline = [];

          /* istanbul ignore else */
          if (Array.isArray(handler.route.middleware)) {
            _push.apply(_pipeline, _require(handler.route.middleware, _options));
          }

          _push.apply(_pipeline, _pipe(Controller.pipeline, handler));

          _pipeline.push({
            name: handler.controller + '.' + handler.action,
            call: [controllerInstance, handler.action],
            type: 'method'
          });

          _pipeline = pipelineFactory('router', _pipeline);

          _controllers[handler.controller].pipeline[handler.action] = _pipeline;
        }

        return _pipeline(conn, _options);
      } else {
        _error(404);
      }
    }

    server.mount(function RouteMappings(conn, _options) {
      return conn.next(function () {
        /* istanbul ignore else */
        if (conn.body === null) {
          return run(conn, _options);
        }
      });
    });
  };
};
