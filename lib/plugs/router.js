'use strict';

const debug = require('debug')('grown:router');

const pipelineFactory = require('../util/pipeline');
const buildFactory = require('../util/factory');
const util = require('../util');

const glob = require('glob');
const path = require('path');
const fs = require('fs');

const ALLOWED_METHODS = ['index', 'create', 'new', 'show', 'edit', 'update', 'destroy'];

module.exports = args => {
  const RouteMappings = require('route-mappings');
  const objectNew = require('object-new');

  const router = new RouteMappings();
  const match = {};

  const _routes = [];
  const _resources = {};
  const _middlewares = {};
  const _fixedMiddlewares = {};
  const _fixedControllers = {};

  ((!Array.isArray(args) && args ? [args] : args) || []).forEach(opts => {
    /* istanbul ignore else */
    if (!Array.isArray(opts.settings) && (typeof opts.settings !== 'string' || !fs.existsSync(opts.settings))) {
      throw new Error(`Expecting 'opts.settings' to be a valid file, given '${opts.settings}' does not exists`);
    }

    /* istanbul ignore else */
    if (opts.middlewares) {
      // load all routes and middlewares from each given directory
      ((!Array.isArray(opts.middlewares) ? [opts.middlewares] : opts.middlewares) || []).forEach(sub => {
        /* istanbul ignore else */
        if (typeof sub.settings !== 'string' || !fs.existsSync(sub.settings)) {
          throw new Error(`Expecting 'opts.middlewares.settings' to be a valid file, given '${sub.settings}' does not exists`);
        }

        debug('Loading settings from %s', path.relative(process.cwd(), opts.middlewares.settings));

        const middlewares = fs.existsSync(opts.middlewares.settings) ? require(opts.middlewares.settings) : {};

        Object.keys(middlewares).forEach(middleware => {
          _middlewares[middleware] = middlewares[middleware];
        });

        // load all available middleware references, override later
        ((!Array.isArray(sub.folders) && sub.folders ? [sub.folders] : sub.folders) || []).forEach(cwd => {
          debug('Loading middlewares from %s', path.relative(process.cwd(), cwd));

          glob.sync('**/*.js', { cwd, nodir: true }).forEach(src => {
            // the middleware is stored by name
            _fixedMiddlewares[path.basename(src.replace(/\/index\.js$/, ''), '.js')] = path.join(cwd, src);
          });
        });
      });
    }

    // load settings and scan controllers
    ((!Array.isArray(opts.folders) && opts.folders ? [opts.folders] : opts.folders) || []).forEach(cwd => {
      debug('Loading controllers from %s', path.relative(process.cwd(), cwd));

      glob.sync('**/*.js', { cwd, nodir: true }).forEach(src => {
        _fixedControllers[src.replace(/(?:\/?index)?\.js$/, '').replace(/\//g, '.')] = {
          filepath: path.join(cwd, src),
        };
      });
    });

    ((!Array.isArray(opts.settings) && opts.settings ? [opts.settings] : opts.settings) || []).forEach(cwd => {
      debug('Loading routes from %s', path.relative(process.cwd(), cwd));

      const routeMappings = require(cwd);

      router.namespace('/', () => routeMappings(RouteMappings));
    });
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
        Array.prototype.push.apply(list, _require(_fixedList, options));
      } else if (list.indexOf(name) === -1) {
        /* istanbul ignore else */
        if (typeof _fixedMiddlewares[name] === 'undefined') {
          throw new Error(`Undefined '${name}' middleware`);
        }

        let _middleware;

        try {
          // normalize required middleware module
          _middleware = require(_fixedMiddlewares[name]);
        } catch (e) {
          throw new Error(`Error loading '${_fixedMiddlewares[name]}' middleware. ${e.message}`);
        }

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
        if (!_fixedControllers[handler.controller].instance[task]) {
          throw new Error(`Undefined '${handler.controller}.${task}' handler`);
        }

        // all calls are methods
        tasks.push({
          name: `${handler.controller}.${task}`,
          call: [_fixedControllers[handler.controller].instance, task],
          type: 'method',
        });
      });
    }

    return tasks;
  }

  const _mappings = router.mappings;

  // resolve routing for controllers lookup
  router.routes.forEach(route => {
    const _handler = route.handler.slice();

    const action = _handler.length > 1 ? _handler.pop() : 'index';
    const controller = _handler.join('.');

    /* istanbul ignore else */
    if (!controller) {
      throw new Error(`Expecting a controller for '${route.path}', given '${controller}'`);
    }

    if (!_fixedControllers[controller]) {
      /* istanbul ignore else */
      if (!route.resource) {
        throw new Error(`Missing controller ${controller}`);
      }

      // skip RESTful controllers
    } else {
      _fixedControllers[controller].pipeline = {};
    }

    /* istanbul ignore else */
    if (!match[route.verb]) {
      match[route.verb] = [];
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
    match[route.verb].push(route);
  });

  // build mapping per-verb
  Object.keys(match).forEach(verb => {
    match[verb] = router.map(match[verb]);
  });

  return $ => {
    const _extensions = $.extensions('Conn._');
    const _scopes = {};

    // expose staticly
    _extensions.controllers = {};
    _extensions.resources = _resources;
    _extensions.routes = _mappings;

    // validate and load controllers
    Object.keys(_fixedControllers)
      .forEach(ctrl => {
        util.ctx.load(_extensions.controllers, _fixedControllers[ctrl], ctrl);
      });

    function run(conn) {
      const _method = conn.method.toUpperCase();

      // resolve matched routes to a single one
      debug('#%s Trying to resolve any route matching %s %s', conn.pid, conn.method, conn.request_path);

      /* istanbul ignore else */
      if (!match[_method]) {
        debug('#%s Error. There are no routes matching for this verb', conn.pid);

        return conn.raise(405);
      }

      // speed up static routes
      const _handler = match[_method](conn.req.url, 1);

      /* istanbul ignore else */
      if (_handler) {
        conn.req.params = {};
        conn.req.handler = util.extend({}, _handler);

        /* istanbul ignore else */
        if (_handler.matcher && _handler.matcher.keys) {
          _handler.matcher.keys.forEach((key, i) => {
            conn.req.params[key] = _handler.matcher.values[i];
          });
        }

        // dummy controller definition as fallback
        if (!_fixedControllers[_handler.controller]) {
          throw new Error(`Missing controller, given '${_handler.controller}'`);
        }

        const Controller = _fixedControllers[_handler.controller].original;
        const controllerInstance = _fixedControllers[_handler.controller].instance;

        /* istanbul ignore else */
        if (controllerInstance && !controllerInstance[_handler.action]) {
          throw new Error(`Undefined '${_handler.controller}.${_handler.action}' action`);
        }

        let _pipeline = _fixedControllers[_handler.controller].pipeline
          && _fixedControllers[_handler.controller].pipeline[_handler.action];

        /* istanbul ignore else */
        if (!_pipeline) {
          debug('#%s Initializing pipeline <%s.%s>',
            conn.pid,
            _handler.controller,
            _handler.action);

          _pipeline = [];

          /* istanbul ignore else */
          if (_extensions.access) {
            debug('#%s Push access pipeline', conn.pid);

            _pipeline.push({
              name: '$access',
              call: _conn =>
                _conn.can(_conn.access, _handler.controller, _handler.action),
              type: 'function',
            });
          }

          /* istanbul ignore else */
          if (Array.isArray(_handler.use)) {
            debug('#%s Push middleware pipeline <%s>',
              conn.pid,
              _handler.use.join(', '));

            Array.prototype.push.apply(_pipeline, _require(_handler.use, $.options));
          }

          /* istanbul ignore else */
          if (Controller) {
            /* istanbul ignore else */
            if (Controller.inject) {
              debug('#%s Push inject pipeline <$>', conn.pid);

              // dependency injection support
              _pipeline.push({
                name: '$inject',
                call: _conn =>
                  util.props(Controller.inject, cb => cb(conn, $.options))
                    .then(deps => objectNew.mergePropertiesInto(_conn, deps)),
                type: 'function',
              });
            }

            debug('#%s Push handler pipeline <%s>', conn.pid, _handler.controller);

            // controller-specific pipeline
            Array.prototype.push.apply(_pipeline, _pipe(Controller.pipeline, _handler));
          }

          debug('#%s Push action pipeline <%s.%s>', conn.pid, _handler.controller, _handler.action);

          // our final action
          _pipeline.push({
            name: `${_handler.controller}.${_handler.action}`,
            call: _conn => Promise.resolve()
              .then(() => controllerInstance && controllerInstance[_handler.action](_conn, $.options))
              .then(retval => {
                /* istanbul ignore else */
                if (retval) {
                  debug('#%s OK. Pipeline <%s> returned', _conn.pid, `${_handler.controller}.${_handler.action}`);

                  _conn.resp_body = retval;
                }
              }),
            type: 'function',
          });

          // compile the pipeline
          _pipeline = pipelineFactory(`${_handler.controller}.${_handler.action}`, _pipeline);

          // memoize
          _fixedControllers[_handler.controller].pipeline[_handler.action] = _pipeline;
        }

        debug('#%s Executing pipeline <%s.%s>',
          conn.pid,
          _handler.controller,
          _handler.action);

        // execute

        return _pipeline(conn, $.options)
          .then(() => {
            /* istanbul ignore else */
            if (conn.is_json || conn.method !== 'GET') {
              return;
            }

            /* istanbul ignore else */
            if (!conn.halted && typeof conn.view === 'function') {
              // FIXME: use settings for this?
              const _partials = [
                `views/${_handler.controller.replace(/\./g, '/')}/${_handler.action}`,
              ];

              /* istanbul ignore else */
              if (conn.handler.resource && ALLOWED_METHODS.indexOf(_handler.action) > -1) {
                _partials.push(`shared/resource/${_handler.action}`);
              }

              conn.view({
                fallthrough: true,
                src: _partials,
                as: 'yield',
              });
            }
          });
      }

      conn.raise(404);
    }

    function call(conn, identifier, middleware) {
      if (typeof _scopes[identifier] === 'undefined') {
        // http-middleware is required (if exists)
        _scopes[identifier] = _middlewares.http
          ? ['http']
          : [];

        // env-middleware is required (if exists)
        _scopes[identifier] = _middlewares[$.env]
          ? _scopes[identifier].concat($.env)
          : _scopes[identifier];

        if (Array.isArray(middleware)) {
          _scopes[identifier] = _scopes[identifier].concat(middleware);
        }

        _scopes[identifier] = _scopes[identifier].length
          ? pipelineFactory(identifier, _require(_scopes[identifier], $.options))
          : false;
      }

      return Promise.resolve()
        .then(() => {
          if (_scopes[identifier]) {
            return _scopes[identifier](conn, $.options);
          }
        });
    }

    // public API
    $.extensions('Conn', {
      identifier: 'set_router_locals',
      before_send() {
        /* istanbul ignore else */
        if (this.is_json || this.method !== 'GET') {
          return;
        }

        this.set_state('handler', this.handler);
        this.set_state('routes', _extensions.routes);
        this.set_state('is', (route, yes, no) => {
          const routes = !Array.isArray(route) && route
            ? [route]
            : route || [];

          no = typeof no === 'undefined'
            ? null
            : no;

          return routes.some(r => {
            /* istanbul ignore else */
            if (!r) {
              return false;
            }

            /* istanbul ignore else */
            if (typeof r === 'string') {
              /* istanbul ignore else */
              if (this.request_path.indexOf(r) === 0) {
                return true;
              }

              return r === this.request_path;
            }

            /* istanbul ignore else */
            if (this.handler.keypath) {
              return this.handler.keypath.filter(x => x === r.as).length;
            }

            /* istanbul ignore else */
            if (this.handler.matcher) {
              return this.handler.matcher.regex.test(r.path);
            }

            return this.handler.as === r.as;
          }) ? yes : no;
        });
      },
      methods: {
        use(identifier, middlewares) {
          return call(this, identifier, middlewares);
        },
      },
      props: {
        resources: () => _extensions.resources,
        routes: () => _extensions.routes,
      },
    });

    // pre-routing pipeline
    $.on('listen', () => {
      $.mount('router', conn => {
        return Promise.resolve()
          .then(() => call(conn, '$http'))
          .then(() => conn.next(() => !conn.has_body && run(conn)));
      });
    });

    $.on('repl', repl => {
      const logger = $.logger.getLogger();

      repl.defineCommand('routes', {
        help: 'Inspect your application routes',
        action(value) {
          const _filter = value.split(' ')[0].toLowerCase();

          let _found = 0;
          let _last;

          function print(routes, depth) {
            Object.keys(routes).forEach(k => {
              const x = routes[k];

              /* istanbul ignore else */
              if (typeof x === 'object' && !Array.isArray(x)) {
                /* istanbul ignore else */
                if (x.handler) {
                  const _lookup = x.handler.slice()
                    .concat(x.verb, x.path, x.as)
                    .join(' ').toLowerCase();

                  /* istanbul ignore else */
                  if (!_filter || _lookup.indexOf(_filter) > -1) {
                    /* istanbul ignore else */
                    if (x.resource && _last !== x.resource) {
                      logger.info('\n{% star %s %}\n', x.resource);
                      _last = x.resource;
                    }

                    /* istanbul ignore else */
                    if (!x.resource) {
                      logger.info('\n');
                      _last = null;
                    }

                    const _tabs = new Array(depth).join('  ');

                    logger.info('%s{% item %s %}\n%s  {% 8.pad.cyan %s %} {% yellow %s %} {% gray as %} %s\n',
                      _tabs, x.handler.join('.'),
                      _tabs, x.verb, x.path, x.as);

                    _found += 1;
                  }
                }

                print(x, depth + 1);
              }
            });
          }

          print(_extensions.routes, 0);

          if (!_found) {
            logger.info('{% error No routes were found %}\n');
          } else {
            logger.info('\n{% end %s route%s %s found %}\n',
              _found,
              _found === 1 ? '' : 's',
              _found === 1 ? 'was' : 'were');
          }

          repl.displayPrompt();
        },
      });
    });
  };
};
