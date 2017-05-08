'use strict';

const debug = require('debug')('grown:router');

const pipelineFactory = require('../util/pipeline');
const buildFactory = require('../util/factory');

const glob = require('glob');
const path = require('path');
const fs = require('fs');

const _slice = Array.prototype.slice;
const _push = Array.prototype.push;
const _map = Array.prototype.map;
const _forEach = Array.prototype.map;

module.exports = function $router() {
  const args = _slice.call(arguments);

  const RouteMappings = require('route-mappings');
  const objectNew = require('object-new');

  const env = process.env.NODE_ENV || 'development';

  const router = new RouteMappings({ middleware: [env] });
  const match = {};

  const _fixedMiddlewares = {};
  const _middlewares = {};

  const _controllers = {};
  const _routes = [];

  // reduce middleware chain into a single pipeline
  function _require(map, options) {
    const list = [];

    map.forEach(name => {
      /* istanbul ignore else */
      if (_middlewares[name]) {
        const _fixedList = Array.isArray(_middlewares[name])
          ? _middlewares[name]
          : [_middlewares[name]];

        // recursively flatten nested middleware
        _push.apply(list, _require(_fixedList, options));
      } else if (list.indexOf(name) === -1) {
        /* istanbul ignore else */
        if (typeof _fixedMiddlewares[name] === 'undefined') {
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
    });

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

      _fixedPipe.forEach(task => {
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

  // load all routes and middlewares from each given directory
  args.forEach(cwd => {
    /* istanbul ignore else */
    if (typeof cwd !== 'string' || !fs.existsSync(cwd)) {
      throw new Error(`Expecting 'cwd' to be a valid directory, given '${cwd}'`);
    }

    const _routeMappings = path.join(cwd, 'config', 'routes.js');

    /* istanbul ignore else */
    if (fs.existsSync(_routeMappings)) {
      debug('Loading routes from %s', _routeMappings);

      const routeMappings = require(_routeMappings);

      router.namespace('/', routeMappings(router({ cwd })));
    }

    // load global middleware definitions
    const _middlewaresFile = path.join(cwd, 'config', 'middlewares.js');

    debug('Loading settings from %s', _middlewaresFile);

    const middlewares = fs.existsSync(_middlewaresFile) ? require(_middlewaresFile) : {};

    Object.keys(middlewares).forEach(middleware => {
      _middlewares[middleware] = middlewares[middleware];
    });

    // load all available middleware references, override later
    glob.sync('middlewares/**/*.js', { cwd, nodir: true }).forEach(middleware => {
      const middlewareName = path.basename(middleware.replace(/\/index\.js$/, ''), '.js');
      const _middlewareFile = path.join(cwd, middleware);

      if (typeof _fixedMiddlewares[middlewareName] === 'undefined') {
        debug('Registering new middleware from %s', _middlewareFile);
      } else {
        debug('Overriding middleware from %s', _middlewareFile);
      }

      // the middleware is stored by name
      _fixedMiddlewares[middlewareName] = _middlewareFile;
    });
  });

  // resolve routing for controllers lookup
  router.routes.forEach(route => {
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
  Object.keys(match).forEach(verb => {
    match[verb] = router.map(match[verb]);
  });

  return ($, util) => {
    // expose staticly
    $.extensions.routes = router.mappings;
    $.extensions.controllers = $.extensions();

    // overload for convenience
    $.extensions.routes.map = _map.bind(_routes);
    $.extensions.routes.forEach = _forEach.bind(_routes);

    // public API
    $.extensions('Conn', {
      before_send() {
        this.put_local('routes', $.extensions.routes);
      },
      props: {
        routes: $.extensions.routes,
      },
    });

    // caching
    const _cache = {};

    function run(conn, _options) {
      const _method = conn.req.method.toLowerCase();

      // resolve matched routes to a single one
      const _base = conn.req.url.split('?')[0];

      debug('Trying to resolve any route matching %s %s', conn.req.method, _base);

      /* istanbul ignore else */
      if (!match[_method]) {
        debug('Error. There are no routes matching for this verb');

        throw util.statusErr(405);
      }

      // speed up static routes
      const _handler = _cache[`${conn.req.method} ${_base}`]
        || (_cache[`${conn.req.method} ${_base}`] = match[_method](conn.req.url, 1));

      if (_handler) {
        debug('Done. Loading handler for <%s> controller', _handler.controller);

        conn.req.params = {};
        conn.req.handler = _handler;

        /* istanbul ignore else */
        if (_handler.matcher && _handler.matcher.keys) {
          _handler.matcher.keys.forEach((key, i) => {
            conn.req.params[key] = _handler.matcher.values[i];
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
          debug('Initializing pipeline <%s.%s>',
            _handler.controller,
            _handler.action);

          _pipeline = [];

          /* istanbul ignore else */
          if (Array.isArray(_handler.route.middleware)) {
            debug('Push middleware pipeline <%s>',
              _handler.route.middleware.join(', '));

            _push.apply(_pipeline, _require(_handler.route.middleware, _options));
          }

          /* istanbul ignore else */
          if (Controller.inject) {
            debug('Push inject pipeline <$>');

            // dependency injection support
            _pipeline.push({
              name: '$',
              call: _conn =>
                util.reduce(Controller.inject, cb => cb(conn, _options))
                  .then(deps => objectNew.mergePropertiesInto(_conn, deps)),
              type: 'function',
            });
          }

          debug('Push handler pipeline <%s>', _handler.controller);

          // controller-specific pipeline
          _push.apply(_pipeline, _pipe(Controller.pipeline, _handler));

          debug('Push action pipeline <%s.%s>', _handler.controller, _handler.action);

          // our final action
          _pipeline.push({
            name: `${_handler.controller}.${_handler.action}`,
            call: [controllerInstance, _handler.action],
            type: 'method',
          });

          debug('Done. Compiling pipeline <%s.%s>',
            _handler.controller,
            _handler.action);

          // compile the pipeline
          _pipeline = pipelineFactory(`${_handler.controller}.${_handler.action}`, _pipeline);

          // memoize
          _controllers[_handler.controller].pipeline[_handler.action] = _pipeline;
        }

        // store instantiated handler reference
        _handler._controller = _controllers[_handler.controller];

        debug('Executing pipeline <%s.%s>',
          _handler.controller,
          _handler.action);

        // execute
        return _pipeline(conn, _options)
          .then(() => {
            // auto-render support
            if (conn.resp_body === null && conn.render) {
              return conn.render(`${_handler.controller}/${_handler.action}`)
                .then(result => {
                  conn.resp_body = result;
                });
            }
          });
      }

      debug('Wait. There are no routes matching for this path');

      throw util.statusErr(404);
    }

    $.mount('router', (conn, _options) =>
      conn.next(() => conn.resp_body === null && run(conn, _options)));

    $.on('repl', (repl, logger) => {
      repl.defineCommand('routes', {
        help: 'Inspect your application routes',
        action(value) {
          const _filter = value.split(' ')[0].toLowerCase();

          $.extensions.routes.forEach(x => {
            const _lookup = [x.controller, x.action, x.route.verb, x.route.path, x.route.as].join(' ').toLowerCase();

            if (!_filter || _lookup.indexOf(_filter) > -1) {
              logger.write(`${x.route.verb} ${x.route.path} (${x.route.as})`, '\n');
            }
          });
        },
      });
    });
  };
};
