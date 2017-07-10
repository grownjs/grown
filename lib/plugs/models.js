'use strict';

const debug = require('debug')('grown:models');

const errorHandler = require('../util/error');
const util = require('../util');

const path = require('path');
const fs = require('fs');

const SQLITE = {
  logging: false,
  dialect: 'sqlite',
  storage: ':memory:',
};

function unwrapMethods(ctx, obj, model) {
  try {
    /* istanbul ignore else */
    if (typeof obj === 'function') {
      obj = obj(ctx);
    }

    Object.keys(obj).forEach(prop => {
      /* istanbul ignore else */
      if (typeof obj[prop] === 'function') {
        obj[prop] = obj[prop](ctx);
      }
    });

    return obj;
  } catch (e) {
    throw new Error(`Failed <${model}> unwrapping. ${e.message}`);
  }
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

    // add identifier for later
    _config.identifier = _config.identifier
      || path.basename(opts.settings.replace(/\/?index\.js$/, ''), '.js');

    const refs = [];

    // load settings and scan models
    ((!Array.isArray(opts.folders) && opts.folders ? [opts.folders] : opts.folders) || []).forEach(cwd => {
      debug('Listing models from %s', path.relative(process.cwd(), cwd));

      _tasks.push($ =>
        new JSONSchemaSequelizer(_config, refs, cwd)
          .scan((def, model) => unwrapMethods($, def, `${_config.identifier}.${model}`)));
    });
  });

  return $ => {
    const _close = [];

    // array-like wrapper
    const _refs = $.extensions('Conn._.models', false);

    // store connections
    const _dbs = $.extensions('Conn._.dbs', false);

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

      /* istanbul ignore else */
      if (!location) {
        errorHandler(e, conn);
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

    $.on('close', () =>
      Promise.all(_close.map(cb => cb())));

    $.on('listen', () =>
      $.mount('resource', conn => {
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
        if (_model && typeof conn.routes === 'function') {
          debug('#%s %s model found', conn.pid, _model.name);

          /* istanbul ignore else */
          if (conn.is_xhr) {
            conn.layout = false;
          }

          const resource = JSONSchemaSequelizer.resource(_model, {
            payload: conn.params.payload,
            where: conn.params.where,
          });

          resource.options.isNew = _handler.action === 'new';
          resource.options.actions = {};

          [_model.name]
            .concat(Object.keys(_model.associations)
            .map(field => _model.associations[field].target.name))
            .forEach(model => {
              const methods = conn.routes(conn.resources[model].controller);

              resource.options.actions[model] = {};

              ['new', 'create', 'edit', 'show', 'update', 'destroy']
                .forEach(prop => {
                  resource.options.actions[model][prop] = {
                    verb: methods[prop].verb,
                    path: methods[prop].path,
                  };
                });

              resource.options.actions[model].index = {
                verb: methods.verb,
                path: methods.path,
              };
            });

          let _method = _handler.action;

          /* istanbul ignore else */
          if (!conn.is_xhr) {
            conn.put_local('resource', resource.options);
          }

          if (_method === 'new') {
            return ok(conn, resource.options);
          }

          if (_method === 'index') {
            _method = 'findAll';
          }

          if (_method === 'edit' || _method === 'show') {
            _method = 'findOne';
          }

          return resource.actions[_method]().then(result => {
            debug('#%s %s loaded', conn.pid, _model.name);

            /* istanbul ignore else */
            if (resource.isNew || _handler.action === 'edit') {
              return ok(conn, resource.options);
            }

            return ok(conn, result);
          })
          .catch(e => err(conn, e));
        }
      }));

    $.on('start', () => Promise.all(_tasks.map(cb =>
      Promise.resolve()
        // FIXME: how-to connect lazily?
        .then(() => cb($.extensions('Conn._')))
        .then(x => x.connect())))
      .then(results => {
        const _sync = [];

        // merge all models
        results.forEach(x => {
          util.extend(_refs, x.models);

          _close.push(() => x.sequelize.close());
          _sync.push(opts => x.sequelize.sync(opts));

          _dbs[x.sequelize.options.identifier] = x;
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
