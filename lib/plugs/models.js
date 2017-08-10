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

    // store all connections details
    const _models = $.extensions('Conn._.models', false);
    const _refs = $.extensions('Conn._.refs', false);
    const _dbs = $.extensions('Conn._.dbs', false);

    function append(conn, model, resource) {
      /* istanbul ignore else */
      if (conn.resources[model]) {
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
      }
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

        const _model = _models
          ? _models[_handler.resource]
          : null;

        /* istanbul ignore else */
        if (_model && typeof conn.routes === 'function') {
          debug('#%s %s model found', conn.pid, _model.name);

          /* istanbul ignore else */
          if (conn.is_xhr) {
            conn.layout = false;
          }

          const resource = JSONSchemaSequelizer.resource(_refs, _model, {
            [_model.primaryKeyAttribute]: conn.params.id,
            payload: conn.params.payload,
            where: conn.params.where,
          });

          resource.options.isNew = _handler.action === 'new';
          resource.options.actions = {};

          // append resource info for nested resources
          [_model.name].concat(Object.keys(resource.options.refs)
            .map(key => resource.options.refs[key].model))
            .forEach(model => append(conn, model, resource));

          let _method = _handler.action;

          /* istanbul ignore else */
          if (!conn.is_xhr) {
            conn.set_state('resource', resource.options);
          }

          /* istanbul ignore else */
          if (_method === 'new') {
            return ok(conn, resource.options);
          }

          /* istanbul ignore else */
          if (_method === 'index') {
            _method = 'findAll';
          }

          /* istanbul ignore else */
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
          util.extend(_refs, x.refs);
          util.extend(_models, x.models);

          _close.push(() => x.sequelize.close());
          _sync.push(opts => x.sequelize.sync(opts));

          if (!_dbs[x.sequelize.options.identifier]) {
            _dbs[x.sequelize.options.identifier] = {};
          }

          util.extend(_dbs[x.sequelize.options.identifier], x);
        });

        // helper for syncing the databases
        util.setProperty(_models, 'sync', opts =>
          Promise.all(_sync.map(cb => cb(opts))));

        // helper for closing the current connection
        util.setProperty(_models, 'close', () =>
          Promise.all(_close.map(cb => cb())));

        // models are available inside the connection
        $.extensions('Conn', {
          props: {
            models: () => _models,
          },
        });
      }));

    $.on('repl', repl => {
      const logger = $.logger.getLogger();

      Object.keys(_models).forEach(key => {
        Object.defineProperty(repl.context, key, {
          configurable: false,
          enumerable: true,
          writable: false,
          value: _models[key],
        });
      });

      repl.defineCommand('models', {
        help: 'Show information about models',
        action() {
          let _found = 0;

          Object.keys(_models).forEach(key => {
            _found += 1;

            logger.info('{% star %s %}\n', key);
            logger.info('  {% gray tableName %} %s\n', _models[key].tableName);
            logger.info('  {% gray attributes %} %s\n', Object.keys(_models[key].attributes).join(', ') || '?');
            logger.info('  {% gray primaryKeys %} %s\n', Object.keys(_models[key].primaryKeys).join(', ') || '?');
            logger.info('  {% gray uniqueKeys %} %s\n', Object.keys(_models[key].uniqueKeys).join(', ') || '?');
            logger.info('  {% gray autoIncrementField %} %s\n', _models[key].autoIncrementField || '?');

            Object.keys(_models[key].refs).forEach(ref => {
              logger.info('  {% item %s %} {% yellow %s %} {% gray as %} %s\n',
                _models[key].refs[ref].associationType, _models[key].refs[ref].target.name, ref);
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
