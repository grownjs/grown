var pipelineFactory = require('./lib/pipeline');
var buildFactory = require('./lib/factory');

var routeMappings = require('route-mappings');
var glob = require('glob');
var path = require('path');
var fs = require('fs');

var _push = Array.prototype.push;

function _error(code, message) {
  var errObj = new Error(message);
  errObj.statusMessage = message;
  errObj.statusCode = code;
  return errObj;
}

function _end(conn) {
  return conn.res.finished;
}

module.exports = function (server, options) {
  if (typeof options.cwd !== 'string' || !fs.existsSync(options.cwd)) {
    throw new Error('expecting `options.cwd` to be a valid directory, given `' + options.cwd + '`');
  }

  var _routeMappings = require(path.join(options.cwd, 'config', 'routeMappings.js'));
  var router = _routeMappings(routeMappings);
  var match = {};

  var _controllers = {};

  router.routes.forEach(function (route) {
    var _handler = route.handler.slice().concat(route.to ? [route.to] : []);

    _handler = _handler.join('.').split('.');

    var controller = _handler[0];
    var action = _handler[1] || route.action;

    var controllerFile = path.join(options.cwd, 'controllers', controller + 'Controller.js');

    if (!fs.existsSync(controllerFile)) {
      throw new Error('missing controller ' + controllerFile);
    }

    _controllers[controller] = {
      filepath: controllerFile,
      instance: null,
      pipeline: {}
    };

    if (!match[route.verb]) {
      match[route.verb] = [];
    }

    match[route.verb].push({
      controller: controller,
      action: action,
      route: route
    });
  });

  Object.keys(match).forEach(function (verb) {
    match[verb] = router.map(match[verb]);
  });

  var _middlewares = require(path.join(options.cwd, 'config', 'middlewares.js'));
  var fixedMiddlewares = {};

  glob.sync('middlewares/**/*.js', { cwd: options.cwd, nodir: true }).forEach(function (middleware) {
    var middlewareName = path.basename(middleware.replace(/\/index\.js$/, ''), '.js');

    fixedMiddlewares[middlewareName] = path.join(options.cwd, middleware);
  });

  function _require(map) {
    var list = [];

    map.forEach(function (name) {
      if (_middlewares[name]) {
        _push.apply(list, _require(_middlewares[name]));
      } else if (list.indexOf(name) === -1) {
        if (!fixedMiddlewares[name]) {
          throw new Error('undefined `' + name + '` middleware');
        }

        var middleware = buildFactory(require(fixedMiddlewares[name]), options);

        list.push({
          name: middleware.name || name,
          call: middleware.call
        });
      }
    }, this);

    return list;
  }

  if (_middlewares.before) {
    server.mount(pipelineFactory('before', _require(['before']), _end));
  }

  function _pipe(from, handler) {
    var tasks = [];

    if (from && from[handler.action]) {
      from[handler.action].forEach(function (task) {
        if (!_controllers[handler.controller].instance[task]) {
          throw new Error('undefined `' + handler.controller + '.' + task + '` handler');
        }

        tasks.push({
          name: handler.controller + '.' + task,
          call: [_controllers[handler.controller].instance, task]
        });
      });
    }

    return tasks;
  }

  server.mount(function (conn, _options) {
    var _method = conn.req.method.toLowerCase();
    var handler;

    if (!match[_method]) {
      throw _error(405, 'Method Not Allowed');
    }

    if (match[_method] && (handler = match[_method](conn.path, 1))) {
      conn.handler = handler;
      conn.params = {};

      if (handler.matcher) {
        handler.matcher.keys.forEach(function(key, i) {
          conn.params[key] = handler.matcher.values[i];
        });
      }

      if (!_controllers[handler.controller].instance) {
        var Controller = require(_controllers[handler.controller].filepath);
        var isClass = typeof Controller === 'function' && Controller.constructor && Controller.name;

        _controllers[handler.controller].instance = isClass ? new Controller() : Controller;
      }

      var controllerInstance = _controllers[handler.controller].instance;

      if (!controllerInstance[handler.action]) {
        throw new Error('undefined `' + handler.controller + '.' + handler.action + '` handler');
      }

      var _pipeline = _controllers[handler.controller].pipeline[handler.action];

      if (!_pipeline) {
        _pipeline = [];

        if (Array.isArray(handler.route.middleware)) {
          _push.apply(_pipeline, _require(handler.route.middleware));
        }

        _push.apply(_pipeline, _pipe(Controller.before, handler));

        _pipeline.push({
          name: handler.controller + '.' + handler.action,
          call: [controllerInstance, handler.action]
        });

        _push.apply(_pipeline, _pipe(Controller.after, handler));

        _pipeline = pipelineFactory('router', _pipeline, _end);

        _controllers[handler.controller].pipeline[handler.action] = _pipeline;
      }

      _pipeline(conn, _options);
    } else {
      throw _error(404, 'Not Found');
    }
  });

  if (_middlewares.after) {
    server.mount(pipelineFactory('after', _require(['after']), _end));
  }
};
