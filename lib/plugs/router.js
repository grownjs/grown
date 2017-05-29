'use strict';

const debug = require('debug')('grown:router');

const pipelineFactory = require('../util/pipeline');
const buildFactory = require('../util/factory');

const glob = require('glob');
const path = require('path');
const fs = require('fs');

const _push = Array.prototype.push;

module.exports = args => {
  const RouteMappings = require('route-mappings');
  const objectNew = require('object-new');

  const router = new RouteMappings();
  const match = {};

  const _tasks = [];
  const _routes = [];
  const _controllers = {};
  const _middlewares = {};
  const _fixedMiddlewares = {};

  ((!Array.isArray(args) && args ? [args] : args) || []).forEach(opts => {
    /* istanbul ignore else */
    if (typeof opts.settings !== 'string' || !fs.existsSync(opts.settings)) {
      throw new Error(`Expecting 'opts.settings' to be a valid file, given '${opts.settings}'`);
    }

    /* istanbul ignore else */
    if (opts.middlewares) {
      // load all routes and middlewares from each given directory
      ((!Array.isArray(opts.middlewares) && opts.middlewares ? [opts.middlewares] : opts.middlewares) || []).forEach(sub => {
        /* istanbul ignore else */
        if (typeof sub.settings !== 'string' || !fs.existsSync(sub.settings)) {
          throw new Error(`Expecting 'opts.middlewares.settings' to be a valid file, given '${sub.settings}'`);
        }

        _tasks.push(() => {
          debug('Loading settings from %s', path.relative(process.cwd(), opts.middlewares.settings));

          const middlewares = fs.existsSync(opts.middlewares.settings) ? require(opts.middlewares.settings) : {};

          Object.keys(middlewares).forEach(middleware => {
            _middlewares[middleware] = middlewares[middleware];
          });

          // load all available middleware references, override later
          ((!Array.isArray(sub.folders) && sub.folders ? [sub.folders] : sub.folders) || []).forEach(cwd => {
            debug('Loading middlewares from %s', path.relative(process.cwd(), cwd));

            glob.sync('**/*.js', { cwd, nodir: true }).forEach(src => {
              const middlewareName = path.basename(src.replace(/\/index\.js$/, ''), '.js');

              if (typeof _fixedMiddlewares[middlewareName] === 'undefined') {
                debug('Registering new middleware from %s', path.relative(process.cwd(), path.join(cwd, src)));
              } else {
                debug('Overriding middleware from %s', path.relative(process.cwd(), path.join(cwd, src)));
              }

              // the middleware is stored by name
              _fixedMiddlewares[middlewareName] = path.join(cwd, src);
            });
          });
        });
      });
    }

    // load settings and scan controllers
    ((!Array.isArray(opts.folders) && opts.folders ? [opts.folders] : opts.folders) || []).forEach(cwd => {
      debug('Loading controllers from %s', path.relative(process.cwd(), cwd));

      glob.sync('**/*.js', { cwd, nodir: true }).forEach(src => {
        debug('Registering controller from %s', path.relative(process.cwd(), path.join(cwd, src)));

        _controllers[src.replace(/(?:index)?\.js$/, '').replace(/\//g, '.')] = {
          filepath: path.join(cwd, src),
        };
      });
    });

    debug('Loading routes from %s', path.relative(process.cwd(), opts.settings));

    const routeMappings = require(opts.settings);

    router.namespace('/', routeMappings(router()));
  });

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

        _middleware = typeof _middleware === 'function'
          ? _middleware(options)
          : _middleware;

        (!Array.isArray(_middleware) ? [_middleware] : _middleware)
          .forEach((middleware, key) => {
            const factory = buildFactory(middleware, options, `${name}.${key}`);

            // push task to pipeline
            list.push({
              name: factory.name || name,
              call: factory.call,
              type: factory.type || 'function',
            });
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

  // resolve routing for controllers lookup
  router.routes.forEach(route => {
    const _handler = route.handler.slice();

    // normalize the action/controller
    const action = route._actionName || _handler.pop();
    const controller = route._resourceName || _handler.pop();

    /* istanbul ignore else */
    if (!_controllers[controller]) {
      throw new Error(`Missing controller ${_controllers[controller]}`);
    }

    _controllers[controller].pipeline = {};

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

  return $ => {
    // expose staticly
    $.extensions.routes = router.mappings;
    $.extensions.controllers = $.extensions();

    // overload for convenience
    $.extensions.routes.map = Array.prototype.map.bind(_routes);
    $.extensions.routes.filter = Array.prototype.filter.bind(_routes);
    $.extensions.routes.reduce = Array.prototype.reduce.bind(_routes);
    $.extensions.routes.forEach = Array.prototype.forEach.bind(_routes);

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

      debug('#%s Trying to resolve any route matching %s %s', conn.pid, conn.req.method, _base);

      /* istanbul ignore else */
      if (!match[_method]) {
        debug('#%s Error. There are no routes matching for this verb', conn.pid);

        throw $.util.statusErr(405);
      }

      // speed up static routes
      const _handler = _cache[`${conn.req.method} ${_base}`]
        || (_cache[`${conn.req.method} ${_base}`] = match[_method](conn.req.url, 1));

      if (_handler) {
        conn.req.params = {};
        conn.req.handler = _handler;

        /* istanbul ignore else */
        if (_handler.matcher && _handler.matcher.keys) {
          _handler.matcher.keys.forEach((key, i) => {
            conn.req.params[key] = _handler.matcher.values[i];
          });
        }

        // read from memory first
        const Controller = $.util.load($.extensions.controllers,
          _controllers[_handler.controller],
          _handler.controller);

        const controllerInstance = _controllers[_handler.controller].instance;

        /* istanbul ignore else */
        if (!controllerInstance[_handler.action]) {
          throw new Error(`Undefined '${_handler.controller}.${_handler.action}' action`);
        }

        let _pipeline = _controllers[_handler.controller].pipeline[_handler.action];

        /* istanbul ignore else */
        if (!_pipeline) {
          debug('#%s Initializing pipeline <%s.%s>',
            conn.pid,
            _handler.controller,
            _handler.action);

          _pipeline = [];

          /* istanbul ignore else */
          if (Array.isArray(_handler.route.middleware)) {
            debug('#%s Push middleware pipeline <%s>',
              conn.pid,
              _handler.route.middleware.join(', '));

            _push.apply(_pipeline, _require(_handler.route.middleware, _options));
          }

          /* istanbul ignore else */
          if (Controller.inject) {
            debug('#%s Push inject pipeline <$>', conn.pid);

            // dependency injection support
            _pipeline.push({
              name: '$',
              call: _conn =>
                $.util.props(Controller.inject, cb => cb(conn, _options))
                  .then(deps => objectNew.mergePropertiesInto(_conn, deps)),
              type: 'function',
            });
          }

          debug('#%s Push handler pipeline <%s>', conn.pid, _handler.controller);

          // controller-specific pipeline
          _push.apply(_pipeline, _pipe(Controller.pipeline, _handler));

          debug('#%s Push action pipeline <%s.%s>', conn.pid, _handler.controller, _handler.action);

          // our final action
          _pipeline.push({
            name: `${_handler.controller}.${_handler.action}`,
            call: _conn => Promise.resolve()
              .then(() => controllerInstance[_handler.action](_conn))
              .then(retval => {
                /* istanbul ignore else */
                if (retval && retval !== null) {
                  _conn.resp_body = retval;
                }
              }),
            type: 'function',
          });

          // compile the pipeline
          _pipeline = pipelineFactory(`${_handler.controller}.${_handler.action}`, _pipeline);

          // memoize
          _controllers[_handler.controller].pipeline[_handler.action] = _pipeline;
        }

        // store instantiated handler reference
        _handler._controller = _controllers[_handler.controller];

        debug('#%s Executing pipeline <%s.%s>',
          conn.pid,
          _handler.controller,
          _handler.action);

        // execute
        return _pipeline(conn, _options)
          .then(() => {
            /* istanbul ignore else */
            if (conn.resp_body === null && conn.view) {
              return conn.view(`${_handler.controller}/${_handler.action}`).end();
            }
          });
      }

      throw $.util.statusErr(404);
    }

    // hooks
    $.on('listen', () => {
      // pre-routing pipeline
      let _http;

      $.mount('router', (conn, _options) => {
        _http = _http || pipelineFactory('@',
          _require(_middlewares[$.env] ? [$.env, 'http'] : [], _options));

        return _http(conn, _options)
          .then(() => conn.next(() => conn.resp_body === null && run(conn, _options)));
      });

      return Promise.all(_tasks.map(cb => cb()));
    });

    $.on('repl', repl => {
      repl.defineCommand('routes', {
        help: 'Inspect your application routes',
        action(value) {
          const _filter = value.split(' ')[0].toLowerCase();

          let _found = 0;

          $.extensions.routes.forEach(x => {
            const _lookup = [x.controller, x.action, x.route.verb, x.route.path, x.route.as].join(' ').toLowerCase();

            /* istanbul ignore else */
            if (!_filter || _lookup.indexOf(_filter) > -1) {
              $.log.info('{% item %s %}\n  {% 8.pad.green %s %} %s\n',
                x.route.as,
                x.route.verb.toUpperCase(),
                x.route.path);

              _found += 1;
            }
          });

          if (!_found) {
            $.log.info('{% error No routes were found %}\n');
          } else {
            $.log.info('{% end %s route%s %s found %}\n',
              _found,
              _found === 1 ? '' : 's',
              _found === 1 ? 'was' : 'were');
          }
        },
      });
    });
  };
};
