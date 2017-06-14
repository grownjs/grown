'use strict';

const debug = require('debug')('grown:router');

const pipelineFactory = require('../util/pipeline');
const buildFactory = require('../util/factory');

const glob = require('glob');
const path = require('path');
const fs = require('fs');

const _push = Array.prototype.push;

const reDotSeparator = /\./g;

const ACTIONS = {
  index: '',
  new: 'new',
  edit: 'edit',
  show: 'show',
  create: 'create',
  update: 'update',
  delete: 'destroy',
};

module.exports = args => {
  const RouteMappings = require('route-mappings');
  const objectNew = require('object-new');

  const router = new RouteMappings();
  const match = {};

  const _routes = [];
  const _controllers = {};
  const _middlewares = {};
  const _fixedMiddlewares = {};

  ((!Array.isArray(args) && args ? [args] : args) || []).forEach(opts => {
    /* istanbul ignore else */
    if (typeof opts.settings !== 'string' || !fs.existsSync(opts.settings)) {
      throw new Error(`Expecting 'opts.settings' to be a valid file, given '${opts.settings}' does not exists`);
    }

    /* istanbul ignore else */
    if (opts.middlewares) {
      // load all routes and middlewares from each given directory
      ((!Array.isArray(opts.middlewares) && opts.middlewares ? [opts.middlewares] : opts.middlewares) || []).forEach(sub => {
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
    }

    // load settings and scan controllers
    ((!Array.isArray(opts.folders) && opts.folders ? [opts.folders] : opts.folders) || []).forEach(cwd => {
      debug('Loading controllers from %s', path.relative(process.cwd(), cwd));

      glob.sync('**/*.js', { cwd, nodir: true }).forEach(src => {
        debug('Registering controller from %s', path.relative(process.cwd(), path.join(cwd, src)));

        _controllers[src.replace(/(?:\/?index)?\.js$/, '').replace(/\//g, '.')] = {
          filepath: path.join(cwd, src),
        };
      });
    });

    debug('Loading routes from %s', path.relative(process.cwd(), opts.settings));

    const routeMappings = require(opts.settings);

    router.namespace('/', () => routeMappings(RouteMappings));
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

    const action = _handler.length > 1 ? _handler.pop() : 'index';
    const controller = _handler.join('.');

    /* istanbul ignore else */
    if (!controller) {
      throw new Error(`Expecting a controller for '${route.path}', given '${controller}'`);
    }

    /* istanbul ignore else */
    if (!_controllers[controller]) {
      throw new Error(`Missing controller ${controller}`);
    }

    _controllers[controller].pipeline = {};

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
    // expose staticly
    $.extensions.controllers = $.extensions();
    $.extensions.routes = $.util.proxyArray(router.mappings, _routes);

    function err(conn, err) {
      /* istanbul ignore else */
      if (conn.is_json) {
        return conn.json({
          result: err.message || err.toString(),
          status: 'error',
        });
      }
    }

    function ok(conn, result) {
      /* istanbul ignore else */
      if (conn.is_json) {
        return conn.json({
          result,
          status: 'ok',
        });
      }
    }

    function run(conn, _options) {
      const _method = conn.req.method.toUpperCase();

      // resolve matched routes to a single one
      debug('#%s Trying to resolve any route matching %s %s', conn.pid, conn.req.method, conn.request_path);

      /* istanbul ignore else */
      if (!match[_method]) {
        debug('#%s Error. There are no routes matching for this verb', conn.pid);

        throw $.util.statusErr(405);
      }

      // speed up static routes
      const _handler = match[_method](conn.req.url, 1);

      /* istanbul ignore else */
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
          if ($.extensions.access) {
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

            _push.apply(_pipeline, _require(_handler.use, _options));
          }

          /* istanbul ignore else */
          if (Controller.inject) {
            debug('#%s Push inject pipeline <$>', conn.pid);

            // dependency injection support
            _pipeline.push({
              name: '$inject',
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
            if (!conn.is_finished) {
              const _base = _handler.controller.replace(reDotSeparator, '/');

              return Promise.resolve()
                .then(() => {
                  // quick json-scaffolding
                  const _model = $.extensions.models
                    ? $.extensions.models[_handler.resource]
                    : null;

                  /* istanbul ignore else */
                  if (_model) {
                    const _mappings = $.extensions.routes(_handler.controller);
                    const _actions = {};
                    const _where = {};

                    _where[_model.primaryKeyAttribute] = conn.params.id;

                    Object.keys(ACTIONS).forEach(key => {
                      _actions[key] = {
                        url: ACTIONS[key] && _mappings[ACTIONS[key]]
                          ? _mappings[ACTIONS[key]].url(conn.params.id)
                          : _mappings.url(),
                        method: ACTIONS[key] && _mappings[ACTIONS[key]]
                          ? _mappings[ACTIONS[key]].verb
                          : _mappings.verb,
                      };
                    });

                    conn.merge_locals(_model.definition);
                    conn.merge_locals({
                      $actions: _actions,
                      $routes: _mappings,
                      $model: _model.name,
                    });

                    // depending on the context we can responds as JSON,
                    // or redirect to a next-page; normal-mode would be
                    // rendering the errored view on cases where:
                    //   new => create
                    //   edit => update
                    //   delete => confirm?
                    // so, on case the "create" action fail thw "new" view is
                    // rendered with the previous body, and captured errors
                    // on ajax-mode can can just respond with JSON as-is
                    // redirect-on-success pages can be configured, so after
                    // saving we can redirect to index, or show, edit, etc.

                    switch (_handler.action) {
                      case 'index':
                        return _model.findAll()
                          .then(data => {
                            /* istanbul ignore else */
                            if (conn.is_json) {
                              return ok(conn, data);
                            }

                            conn.put_local('$data', data);
                          });

                      case 'new':
                        conn.put_local('$isNew', true);
                        break;

                      case 'show':
                      case 'edit':
                        return _model.findOne({
                            // attributes: _model.definition.$uiFields.map(x => x.field),
                            where: _where,
                          })
                          .then(data => {
                            /* istanbul ignore else */
                            if (conn.is_json) {
                              return ok(conn, data);
                            }

                            conn.put_local('$result', data);
                          });

                      case 'update':
                        return _model.update(conn.params.payload, {
                            where: _where,
                          });

                      case 'create':
                        return _model.create(conn.params.payload);

                      case 'destroy':
                        return _model.destroy({
                            where: _where,
                          });

                      default:
                        conn.raise(501);
                    }
                  }
                })
                .then(() => !conn.is_finished
                  && typeof conn.view === 'function'
                  && conn.view({
                    src: `${_base}/${_handler.action}`,
                    as: 'yield',
                  }).end());
            }
          });
      }

      conn.raise(404);
    }

    // public API
    $.extensions('Conn', {
      before_send() {
        this.put_local('routes', $.extensions.routes);
      },
      props: {
        routes: () => $.extensions.routes,
      },
    });

    // pre-routing pipeline
    $.on('listen', () => {
      let _http;

      $.mount('router', (conn, _options) => {
        /* istanbul ignore else */
        if (typeof _http === 'undefined') {
          _http = _middlewares.http
            ? ['http']
            : [];

          _http = _middlewares[$.env]
            ? _http.concat($.env)
            : _http;

          _http = _http.length
            ? pipelineFactory('$http', _require(_http, _options))
            : false;
        }

        return Promise.resolve()
          .then(() => _http && _http(conn, _options))
          .then(() => conn.next(() => !conn.is_finished && run(conn, _options)))
          .then(result => ok(conn.result))
          .catch(error => err(conn, error));
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

          $.extensions.routes.forEach(x => {
            const _lookup = [x.controller, x.action, x.verb, x.path, x.as].join(' ').toLowerCase();

            /* istanbul ignore else */
            if (!_filter || _lookup.indexOf(_filter) > -1) {
              /* istanbul ignore else */
              if (x.resource && _last !== x.resource) {
                logger.info('{% star %s %}\n', x.resource);
                _last = x.resource;
              }

              /* istanbul ignore else */
              if (!x.resource) {
                _last = null;
              }

              logger.info('%s{% item %s %} %s\n%s  {% 8.pad.green %s %} %s\n',
                _last ? '  ' : '',
                x.as, `{% cyan ⇒ ${x.controller}.${x.action} %}`,
                _last ? '  ' : '',
                x.verb,
                x.path);

              _found += 1;
            }
          });

          if (!_found) {
            logger.info('{% error No routes were found %}\n');
          } else {
            logger.info('{% end %s route%s %s found %}\n',
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
