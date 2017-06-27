'use strict';

const debug = require('debug')('grown:models');

const util = require('../util');

const path = require('path');
const fs = require('fs');

const SQLITE = {
  logging: false,
  dialect: 'sqlite',
  storage: ':memory:',
};

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
  const JSONSchemaSequelizer = require('json-schema-sequelizer');
  const Sequelize = require('sequelize');

  const _environment = process.env.NODE_ENV || 'development';
  const _tasks = [];

  ((!Array.isArray(args) && args ? [args] : args) || []).forEach(opts => {
    /* istanbul ignore else */
    if (typeof opts.settings !== 'string' || !fs.existsSync(opts.settings)) {
      throw new Error(`Expecting 'opts.settings' to be a valid file, given '${opts.settings}' does not exists`);
    }

    // read configuration from each given directory
    let _config;

    debug('Loading settings from %s', path.relative(process.cwd(), opts.settings));

    if (fs.existsSync(opts.settings)) {
      _config = require(opts.settings);
      _config = _config[_environment] || _config;
    } else {
      debug('Missing database config. Fallback to SQLite3 (memory)');
    }

    // fallback to sqlite3
    _config = _config || SQLITE;

    /* istanbul ignore else */
    if (typeof _config === 'object') {
      _config.driver = _config.dialect;
      _config.filename = _config.storage;
    }

    // normalize logger
    _config.logging = opts.logger || _config.logging;

    const conn = new Sequelize(_config);
    const refs = [];

    // load settings and scan models
    ((!Array.isArray(opts.folders) && opts.folders ? [opts.folders] : opts.folders) || []).forEach(cwd => {
      debug('Listing models from %s', path.relative(process.cwd(), cwd));

      _tasks.push($ => new JSONSchemaSequelizer(conn, refs, cwd, $));
    });
  });

  return $ => {
    const _close = [];

    // array-like wrapper
    const _refs = $.extensions.models = {};

    function _fixParams(schema, data, props) {
      Object.keys(schema.properties).forEach(prop => {
        /* istanbul ignore else */
        if (props[prop] && props[prop].type === 'BelongsTo') {
          // FIXME: adjust from PKs
          data[`${prop}Id`] = data[prop] ? data[prop].id : null;
          delete data[prop];
        }
      });

      return data;
    }

    function mix(s, t) {
      /* istanbul ignore else */
      if (s) {
        Object.keys(s).forEach(k => {
          if (!t[k]) {
            t[k] = s[k];
          } else {
            t[k] = mix(s[k], t[k] || {});
          }
        });
      }

      return t;
    }

    function pack(action, model, obj) {
      Object.keys(obj).forEach(key => {
        /* istanbul ignore else */
        if (!Array.isArray(obj[key]) && typeof obj[key] === 'object' && obj[key] !== null && model.refs[key]) {
          const props = pack(action, model.refs[key].target, obj[key]);

          switch (action) {
            case 'index':
            case 'edit':
            case 'show':
              props.model = model.refs[key].target;
              props.as = key;
              obj.include.push(props);
              break;

            default:
              obj.include.push(model.refs[key]);
              break;
          }

          delete obj[key];
        }
      });

      return obj;
    }

    function _getOpts(model, action, params) {
      /* istanbul ignore else */
      if (action === 'update' || action === 'create' || action === 'destroy') {
        // write operations works better with all-nested
        return mix(params, {
          include: [{ all: true, nested: true }],
        });
      }

      const value = model.definition.$uiFields[action]
        || model.definition.$uiFields.index;

      /* istanbul ignore else */
      if (Array.isArray(value)) {
        const obj = {
          include: [],
          attributes: [],
        };

        value.forEach(x => {
          const key = typeof x === 'object' ? x.prop : x;

          if (key.indexOf('.') === -1) {
            obj.attributes.push(key);
          } else {
            const keys = key.split('.');

            let u = obj;
            let k;

            while (keys.length > 1) {
              k = keys.shift();

              /* istanbul ignore else */
              if (!u[k]) {
                u[k] = {
                  include: [],
                  attributes: [],
                };
              }

              u = u[k];
            }

            u.attributes.push(keys[0]);
          }
        });

        return pack(action, model, mix(params, obj));
      }

      return pack(action, model, mix(params, util.extend({}, value)));
    }

    function end(conn, location) {
      /* istanbul ignore else */
      if (location) {
        return conn.redirect(location);
      }

      return conn.end();
    }

    function err(conn, e, location) {
      debug('#%s Wait. Resource failed: %s', conn.pid, e.message);

      conn.put_status(400);

      /* istanbul ignore else */
      if (conn.is_json) {
        return conn.json({
          result: e.message || e.toString(),
          errors: e.errors || [],
          status: 'error',
          redirect: location,
        });
      }

      return end(conn, location);
    }

    function ok(conn, result, location) {
      debug('#%s OK. Resource finished', conn.pid);

      /* istanbul ignore else */
      if (conn.is_json) {
        return conn.json({
          result,
          status: 'ok',
          redirect: location,
        });
      }

      return end(conn, location);
    }

    function add(name, routes, actions) {
      actions[name] = {};

      Object.keys(ACTIONS).forEach(key => {
        actions[name][key] = {
          url: ACTIONS[key] && routes[ACTIONS[key]]
            ? routes[ACTIONS[key]].url
            : routes.url,
          path: ACTIONS[key] && routes[ACTIONS[key]]
            ? routes[ACTIONS[key]].path
            : routes.path,
          method: ACTIONS[key] && routes[ACTIONS[key]]
            ? routes[ACTIONS[key]].verb
            : routes.verb,
        };
      });
    }

    function push(model, seen, cb) {
      /* istanbul ignore else */
      if (seen.indexOf(model) > -1) {
        return;
      }

      seen.push(model);

      Object.keys(model.refs).map(key => model.refs[key].target)
        .forEach(m => {
          push(m, seen, cb);
          cb(m);
        });
    }

    $.on('listen', () => {
      $.mount('models', conn => {
        /* istanbul ignore else */
        if (conn.halted) {
          debug('#%s Skip. Response was done', conn.pid);
          return;
        }

        debug('#%s Checking for resources', conn.pid);

        const _handler = conn.handler;

        conn.put_status(200);

        /* istanbul ignore else */
        if (!_handler || !_handler.resource) {
          debug('#%s No resources found', conn.pid);
          return;
        }

        const _model = _refs
          ? _refs[_handler.resource]
          : null;

        /* istanbul ignore else */
        if (_model && conn.routes) {
          debug('#%s %s model found', conn.pid, _model.name);

          /* istanbul ignore else */
          if (conn.is_xhr) {
            conn.layout = false;
          }

          const _actions = {};
          const _models = {};
          const _where = {};
          const _props = {};
          const _seen = [];

          // FIXME: exports useful props somewhere...
          _where[_model.primaryKeyAttribute] = conn.params.id || -1;

          add(_model.name, conn.routes(_handler.controller), _actions);

          push(_model, _seen, m => {
            /* istanbul ignore else */
            if (conn.resources[m.name]) {
              add(m.name, conn.routes(conn.resources[m.name].controller), _actions);
            }
          });

          Object.keys(_model.refs)
            .forEach(ref => {
              _props[ref] = {
                type: _model.refs[ref].associationType,
                model: _model.refs[ref].target.name,
              };

              /* istanbul ignore else */
              if (!_models[_model.refs[ref].target.name]) {
                _models[_model.refs[ref].target.name] = {
                  schema: _model.refs[ref].target.definition.$schema,
                  uiSchema: _model.refs[ref].target.definition.$uiSchema,
                };
              }
            });

          conn.put_local('resource', util.extend({}, _model.definition));
          conn.put_local('resource.$actions', _actions);
          conn.put_local('resource.$models', _models);
          conn.put_local('resource.$model', _model.name);
          conn.put_local('resource.$refs', _props);

          // FIXME: how-to fake?
          switch (_handler.action) {
            case 'index':
              return _model.findAll(_getOpts(_model, _handler.action))
              .then(data => {
                debug('#%s Data found (%s row%s)', conn.pid, data.length,
                  data.length === 1 ? '' : 's');

                /* istanbul ignore else */
                if (conn.is_json) {
                  return ok(conn, data);
                }

                conn.put_local('resource.$data', data);
              });

            case 'new':
              conn.put_local('resource.$isNew', true);

              /* istanbul ignore else */
              if (conn.is_json) {
                return ok(conn, conn.resp_locals.resource);
              }
              break;

            case 'show':
            case 'edit':
              return _model.findOne(_getOpts(_model, _handler.action, { where: _where }))
              .then(data => {
                /* istanbul ignore else */
                if (!data) {
                  debug('#%s Row not found', conn.pid);

                  conn.put_status(404);

                  /* istanbul ignore else */
                  if (conn.is_json) {
                    return err(conn, new Error('Row not found'), _actions[_model.name].index.path);
                  }

                  throw new Error('Row not found');
                }

                debug('#%s Row found', conn.pid);

                /* istanbul ignore else */
                if (data) {
                  conn.put_local('resource.$data', data);
                }

                /* istanbul ignore else */
                if (conn.is_json) {
                  return ok(conn, conn.resp_locals.resource);
                }
              });

            case 'update':
              debug('#%s Updating resource %s', conn.pid, JSON.stringify(_where));

              return Promise.resolve()
                .then(() => {
                  const _pk = {};

                  _pk[`${_model.name}Id`] = conn.params.id;

                  const payload = _fixParams(_model.definition.$schema, conn.params.payload, _props);

                  return Promise.all(Object.keys(_props)
                    .map(key =>
                      _props[key].type === 'HasOne'
                      && (payload[key].id
                        ? _model.refs[key].target.update(payload[key], {
                          where: { id: payload[key].id },
                        })
                        : _model.refs[key].target.create(util.extend(_pk, payload[key]))
                      )))
                    .then(() => _model.update(payload, _getOpts(_model, _handler.action, { where: _where })));
                })
                .then(modified => ({ changed: modified[0] }))
                .then(result => ok(conn, result, _actions[_model.name].index.path))
                .catch(error => err(conn, error, _actions[_model.name].edit.url(conn.params.id)));

            case 'create':
              debug('#%s Creating resource with [%s]', conn.pid, Object.keys(conn.params.payload).join(', '));

              return _model.create(_fixParams(_model.definition.$schema, conn.params.payload, _props), _getOpts(_model, _handler.action))
                .then(result => ok(conn, result, _actions[_model.name].index.path))
                .catch(error => err(conn, error, _actions[_model.name].new.path));

            case 'destroy':
              debug('#%s Destroying resource', conn.pid, JSON.stringify(_where));

              return _model.destroy(_getOpts(_model, _handler.action, { where: _where }))
                .then(result => ok(conn, result, _actions[_model.name].index.path))
                .catch(error => err(conn, error, _actions[_model.name].index.path));

            default:
              conn.raise(501);
          }
        }
      });
    });

    $.on('close', () =>
      Promise.all(_close.map(cb => cb())));

    $.on('start', () => Promise.all(_tasks.map(cb => cb($.extensions)))
      .then(results => {
        const _sync = [];

        // merge all models
        results.forEach(models => {
          util.extend(_refs, models);
          _close.push(() => models.close());
          _sync.push(opts => models.sync(opts));
        });

        // helper for syncing the databases
        util.setProperty(_refs, 'sync', opts =>
          Promise.all(_sync.map(cb => cb(opts))));

        // helper for closing the current connection
        util.setProperty(_refs, 'close', () =>
          Promise.all(_close.map(cb => cb())));

        // models are available inside the connection
        $.extensions('Conn', {
          props: {
            models: () => _refs,
          },
        });
      }));

    $.on('repl', repl => {
      const logger = $.logger.getLogger();

      Object.keys(_refs).forEach(key => {
        Object.defineProperty(repl.context, key, {
          configurable: false,
          enumerable: true,
          writable: false,
          value: _refs[key],
        });
      });

      repl.defineCommand('models', {
        help: 'Show information about models',
        action() {
          let _found = 0;

          Object.keys(_refs).forEach(key => {
            _found += 1;

            logger.info('{% star %s %}\n', key);
            logger.info('  {% gray tableName %} %s\n', _refs[key].tableName);
            logger.info('  {% gray attributes %} %s\n', Object.keys(_refs[key].attributes).join(', ') || '?');
            logger.info('  {% gray primaryKeys %} %s\n', Object.keys(_refs[key].primaryKeys).join(', ') || '?');
            logger.info('  {% gray uniqueKeys %} %s\n', Object.keys(_refs[key].uniqueKeys).join(', ') || '?');
            logger.info('  {% gray autoIncrementField %} %s\n', _refs[key].autoIncrementField || '?');

            Object.keys(_refs[key].refs).forEach(ref => {
              logger.info('  {% item %s %} {% yellow %s %} {% gray as %} %s\n',
                _refs[key].refs[ref].associationType, _refs[key].refs[ref].target.name, ref);
            });
          });

          if (!_found) {
            logger.info('{% error No models were found %}\n');
          } else {
            logger.info('{% end %s model%s %s found %}\n',
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
