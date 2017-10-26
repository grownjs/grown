'use strict';

const debug = require('debug')('grown:models');

const errorHandler = require('../util/error');
const util = require('../util');

const path = require('path');
const fs = require('fs');

function unwrapMethods(ctx, obj, model, sequelize) {
  try {
    /* istanbul ignore else */
    if (typeof obj === 'function') {
      obj = obj(ctx);
    }

    Object.keys(obj).forEach(prop => {
      /* istanbul ignore else */
      if (typeof obj[prop] === 'function') {
        obj[prop] = obj[prop](ctx, sequelize);
      }
    });

    return obj;
  } catch (e) {
    throw new Error(`Failed <${model}> unwrapping. ${e.stack}`);
  }
}

function defineProp(target, key, value) {
  Object.defineProperty(target, key, {
    configurable: false,
    enumerable: false,
    writable: false,
    value,
  });
}

module.exports = args => {
  const JSONSchemaSequelizer = require('json-schema-sequelizer');

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

    _config = require(opts.settings);
    _config = _config[_environment] || _config;

    /* istanbul ignore else */
    if (typeof _config === 'object') {
      _config.driver = _config.dialect;
      _config.filename = _config.storage;
    }

    // normalize logger
    _config.logging = opts.logger || _config.logging;

    // store references
    _config.baseDir = path.dirname(opts.settings);
    _config.jsonFile = opts.settings.indexOf('.json') > -1
      ? opts.settings
      : null;

    _config.identifier = _config.identifier
      || path.basename(path.dirname(opts.settings), '.js');

    const refs = [];

    // load settings and scan models
    ((!Array.isArray(opts.folders) && opts.folders ? [opts.folders] : opts.folders) || []).forEach(cwd => {
      debug('Listing models from %s', path.relative(process.cwd(), cwd));

      _tasks.push($ => {
        const db = new JSONSchemaSequelizer(_config, refs, cwd);

        return db.scan((def, model, sequelize) =>
          unwrapMethods($, def, `${_config.identifier}.${model}`, sequelize))
        .connect();
      });
    });

    /* istanbul ignore else */
    if (!opts.folders || opts.folders.length === 0) {
      debug('Skip. Without models, connection only');

      _tasks.push(() => new JSONSchemaSequelizer(_config, refs));
    }
  });

  return $ => {
    const _close = [];

    // store all connections details
    const _models = $.extensions('Conn._.models', false);
    const _refs = $.extensions('Conn._.refs', false);
    const _dbs = $.extensions('Conn._.dbs', false);

    function buildModel(models, handler) {
      const definition = models && models[handler.resource];

      /* istanbul ignore else */
      if (!definition) {
        throw new Error(`Undefined resource ${handler.resource}`);
      }

      return definition;
    }

    function append(conn, model, resource) {
      /* istanbul ignore else */
      if (typeof conn.routes === 'function' && conn.resources[model]) {
        resource.options.actions[model] = {};

        ['new', 'create', 'edit', 'show', 'update', 'destroy']
          .forEach(prop => {
            /* istanbul ignore else */
            if (conn.resources[model][prop]) {
              resource.options.actions[model][prop] = {
                verb: conn.resources[model][prop].verb,
                path: conn.resources[model][prop].path,
              };
            }
          });

        resource.options.actions[model].index = {
          verb: conn.resources[model].verb,
          path: conn.resources[model].path,
        };
      }
    }

    function end(conn, location) {
      /* istanbul ignore else */
      if (location) {
        return conn.redirect(location);
      }
    }

    function err(conn, e, location) {
      debug('#%s Wait. Resource failed: %s', conn.pid, e.stack);

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

      /* istanbul ignore else */
      if (!location) {
        debug('#%s Skip. Resource was errored', conn.pid);

        conn.resp_body = errorHandler(e, conn, !conn.is_xhr, $.options);
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

    $.extensions('Conn', {
      identifier: 'do_model_resources',
      before_send() {
        debug('#%s Checking for resources', this.pid);

        const _handler = this.handler;

        /* istanbul ignore else */
        if (!_handler || !_handler.resource) {
          debug('#%s No resources found', this.pid);
          return;
        }

        let db = this.database;

        /* istanbul ignore else */
        if (typeof db === 'function') {
          db = db();
        }

        /* istanbul ignore else */
        if (!db || !_dbs[db]) {
          throw new Error(`Unknown database ${db}`);
        }

        const _model = buildModel(util.extend({}, _dbs[db].models, _models), _handler);

        debug('#%s %s model found (%s)', this.pid, _model.name, db);

        /* istanbul ignore else */
        if (this.is_xhr) {
          this.layout = false;
        }

        const resource = JSONSchemaSequelizer.resource(util.extend({}, _dbs[db].refs, _refs), _model, {
          [_model.primaryKeyAttribute]: this.params[_model.primaryKeyAttribute],
          payload: this.params.payload,
          where: this.params.where,
        });

        resource.options.isNew = _handler.action === 'new';
        resource.options.action = _handler.action;
        resource.options.actions = {};

        // append resource info for nested resources
        [_model.name].concat(Object.keys(resource.options.refs)
          .map(key => resource.options.refs[key].model))
          .forEach(model => append(this, model, resource));

        let _method = _handler.action;

        /* istanbul ignore else */
        if (!this.is_xhr) {
          this.set_state('resource', resource.options);
        }

        /* istanbul ignore else */
        if (typeof _model.setResource === 'function') {
          _model.setResource(this, resource);
        }

        /* istanbul ignore else */
        if (_method === 'new') {
          return ok(this, resource.options);
        }

        /* istanbul ignore else */
        if (_method === 'index') {
          _method = 'findAll';
        }

        /* istanbul ignore else */
        if (_method === 'edit' || _method === 'show') {
          _method = 'findOne';
        }

        return Promise.resolve()
          .then(() => {
            /* istanbul ignore else */
            if (_method.indexOf('find') === 0 || !_model.virtual) {
              return resource.actions[_method]();
            }
          })
          .then(result => {
            debug('#%s %s loaded', this.pid, _model.name);

            /* istanbul ignore else */
            if (resource.isNew || _handler.action === 'edit') {
              return ok(this, resource.options);
            }

            return ok(this, result);
          })
          .catch(e => err(this, e));
      },
      props: {
        database: 'default',
        models() {
          let db = this.database;

          /* istanbul ignore else */
          if (typeof db === 'function') {
            db = db();
          }

          /* istanbul ignore else */
          if (!db || !_dbs[db]) {
            throw new Error(`Unknown database ${db}`);
          }

          // overload references
          return util.extend({}, _dbs[db].models, _models);
        },
      },
    });

    $.on('close', () =>
      Promise.all(_close.map(cb => cb())));

    $.on('start', () => {
      debug('Loading all model definitions');

      return Promise.all(_tasks.map(cb => cb($.extensions('Conn._'))))
        .then(results => {
          let _count = 0;

          const _sync = [];

          // merge all models
          results.forEach(x => {
            _count += Object.keys(x.models).length;

            _close.push(() => x.sequelize.close());
            _sync.push(opts => x.sequelize.sync(opts));

            // overload references
            util.extend(_refs, x.refs);
            util.extend(_models, x.models);

            // convert namespaces
            _dbs[util.ucwords(x.sequelize.options.identifier, '', false)] = x;
          });

          debug('Done. %s model%s %s loaded',
            _count,
            _count === 1 ? '' : 's',
            _count === 1 ? 'was' : 'were');

          // helper for syncing the databases
          defineProp(_dbs, 'sync', opts =>
            Promise.all(_sync.map(cb => cb(opts))));

          // helper for closing the current connection
          defineProp(_dbs, 'close', () =>
            Promise.all(_close.map(cb => cb())));
        });
    });

    $.on('repl', repl => {
      const logger = $.logger.getLogger();

      repl.defineCommand('models', {
        help: 'Show information about models',
        action() {
          let _found = 0;

          Object.keys(_dbs).forEach(db => {
            logger.info('{% star.yellow %s: %}\n', _dbs[db].sequelize.options.identifier);

            const m = _dbs[db].models;

            Object.keys(m).forEach(key => {
              _found += 1;

              logger.info('{% line %s %}\n', key);

              if (!m[key].virtual) {
                logger.info('  {% gray tableName %} %s\n', m[key].tableName);
                logger.info('  {% gray attributes %} %s\n', Object.keys(m[key].attributes).join(', ') || '?');
                logger.info('  {% gray primaryKeys %} %s\n', Object.keys(m[key].primaryKeys).join(', ') || '?');
                logger.info('  {% gray uniqueKeys %} %s\n', Object.keys(m[key].uniqueKeys).join(', ') || '?');
                logger.info('  {% gray autoIncrementField %} %s\n', m[key].autoIncrementField || '?');
              }

              Object.keys(m[key].refs).forEach(ref => {
                logger.info('  {% item %s %} {% yellow %s %} {% gray as %} %s\n',
                  m[key].refs[ref].associationType, m[key].refs[ref].target.name, ref);
              });
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
