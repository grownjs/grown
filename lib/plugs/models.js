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

    const conn = new Sequelize(_config);
    const refs = [];

    // load settings and scan models
    ((!Array.isArray(opts.folders) && opts.folders ? [opts.folders] : opts.folders) || []).forEach(cwd => {
      debug('Listing models from %s', path.relative(process.cwd(), cwd));

      _tasks.push(() => new JSONSchemaSequelizer(conn, refs, cwd));
    });
  });

  return $ => {
    const _close = [];

    // array-like wrapper
    const _refs = $.extensions.models = util.proxyArray();

    function end(conn, location) {
      /* istanbul ignore else */
      if (location) {
        return conn.redirect(location);
      }
      // return conn.end();
    }

    function err(conn, e, location) {
      debug('#%s Wait. Resource failed', conn.pid);

      /* istanbul ignore else */
      if (conn.is_json) {
        return conn.json({
          result: e.message || e.toString(),
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

          const _mappings = conn.routes(_handler.controller);
          const _actions = {};
          const _where = {};

          _where[_model.primaryKeyAttribute] = conn.params.id || -1;

          Object.keys(ACTIONS).forEach(key => {
            _actions[key] = {
              url: ACTIONS[key] && _mappings[ACTIONS[key]]
                ? _mappings[ACTIONS[key]].url(conn.params)
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

          switch (_handler.action) {
            case 'index':
              return _model.findAll()
                .then(data => {
                  debug('#%s Data found (%s row%s)', conn.pid, data.length,
                    data.length === 1 ? '' : 's');

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
                where: _where,
              })
              .then(data => {
                debug('#%s Row found', conn.pid);

                /* istanbul ignore else */
                if (conn.is_json) {
                  return ok(conn, data);
                }

                conn.put_local('$result', data);
              });

            case 'update':
              debug('#%s Updating resource %s', conn.pid, JSON.stringify(_where));

              return _model.update(conn.params.payload, {
                where: _where,
              })
              .then(result => ok(conn, result, _mappings.url()))
              .catch(error => err(conn, error, _mappings.edit(conn.params.id)));

            case 'create':
              debug('#%s Creating resource with [%s]', conn.pid, Object.keys(conn.params.payload).join(', '));

              return _model.create(conn.params.payload)
                .then(result => ok(conn, result, _mappings.url()))
                .catch(error => err(conn, error, _mappings.new.url()));

            case 'destroy':
              debug('#%s Destroying resource', conn.pid, JSON.stringify(_where));

              return _model.destroy({
                where: _where,
              })
              .then(result => ok(conn, result, _mappings.url()))
              .catch(error => err(conn, error, _mappings.url()));

            default:
              conn.raise(501);
          }
        }
      });
    });

    $.on('close', () =>
      Promise.all(_close.map(cb => cb())));

    $.on('start', () => Promise.all(_tasks.map(cb => cb()))
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

            logger.info('{% item %s %}\n', key);
            logger.info('  {% gray tableName %} %s\n', _refs[key].tableName);
            logger.info('  {% gray attributes %} %s\n', Object.keys(_refs[key].attributes).join(', ') || '?');
            logger.info('  {% gray primaryKeys %} %s\n', Object.keys(_refs[key].primaryKeys).join(', ') || '?');
            logger.info('  {% gray uniqueKeys %} %s\n', Object.keys(_refs[key].uniqueKeys).join(', ') || '?');
            logger.info('  {% gray autoIncrementField %} %s\n', _refs[key].autoIncrementField || '?');
            logger.info('  {% gray refs %} %s\n', Object.keys(_refs[key].refs).join(', ') || '?');
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
