'use strict';

const debug = require('debug')('grown:models');

const path = require('path');
const fs = require('fs');

const _sqlite = {
  logging: false,
  dialect: 'sqlite',
  storage: ':memory:',
};

module.exports = args => {
  const JSONSchemaSequelizer = require('json-schema-sequelizer');
  const Sequelize = require('sequelize');

  const _environment = process.env.NODE_ENV || 'development';
  const _tasks = [];

  ((!Array.isArray(args) && args ? [args] : args) || []).forEach(opts => {
    /* istanbul ignore else */
    if (typeof opts.settings !== 'string' || !fs.existsSync(opts.settings)) {
      throw new Error(`Expecting 'opts.settings' to be a valid file, given '${opts.settings}'`);
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
    _config = _config || _sqlite;

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

      _tasks.push(new JSONSchemaSequelizer(conn, refs, cwd));
    });
  });

  return $ => {
    const _refs = {};
    const _close = [];

    $.on('close', () =>
      Promise.all(_close.map(cb => cb())));

    $.on('start', () => Promise.all(_tasks)
      .then(results => {
        const _sync = [];

        // merge all models
        results.forEach(models => {
          $.util.extend(_refs, models);
          _close.push(() => models.close());
          _sync.push(opts => models.sync(opts));
        });

        const _count = Object.keys(_refs).length - 1;

        // models are available statictly
        $.extensions.models = _refs;

        // helper for syncing the databases
        Object.defineProperty(_refs, 'sync', {
          configurable: false,
          enumerable: false,
          writable: false,
          value: opts =>
            Promise.all(_sync.map(cb => cb(opts)))
            .then(() => _refs)
              .then(() => {
                debug('%s model%s %s synced',
                  _count,
                  _count === 1 ? '' : 's',
                  _count === 1 ? 'was' : 'were');
              }),
        });

        // helper for closing the current connection
        Object.defineProperty(_refs, 'close', {
          configurable: false,
          enumerable: false,
          writable: false,
          value: () =>
            Promise.all(_close.map(cb => cb())),
        });

        // models are available inside the connection
        $.extensions('Conn', {
          props: {
            models: _refs,
          },
        });

        debug('%s model%s %s loaded',
          _count,
          _count === 1 ? '' : 's',
          _count === 1 ? 'was' : 'were');
      }));

    $.on('repl', repl => {
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

            $.log.info('{% item %s %}\n', key);
            $.log.info('  {% gray tableName %} %s\n', _refs[key].tableName);
            $.log.info('  {% gray attributes %} %s\n', Object.keys(_refs[key].attributes).join(', ') || '?');
            $.log.info('  {% gray primaryKeys %} %s\n', Object.keys(_refs[key].primaryKeys).join(', ') || '?');
            $.log.info('  {% gray uniqueKeys %} %s\n', Object.keys(_refs[key].uniqueKeys).join(', ') || '?');
            $.log.info('  {% gray autoIncrementField %} %s\n', _refs[key].autoIncrementField || '?');
            $.log.info('  {% gray refs %} %s\n', Object.keys(_refs[key].refs).join(', ') || '?');
          });

          if (!_found) {
            $.log.info('{% error No models were found %}\n');
          } else {
            $.log.info('{% end %s model%s %s found %}\n',
              _found,
              _found === 1 ? '' : 's',
              _found === 1 ? 'was' : 'were');
          }
        },
      });
    });
  };
};
