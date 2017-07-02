'use strict';

const path = require('path');
const glob = require('glob');
const fs = require('fs-extra');

const JSONSchemaSequelizer = require('json-schema-sequelizer');

function cmdStatus(umzug) {
  const result = {};

  return umzug.executed()
    .then(executed => {
      result.executed = executed;
      return umzug.pending();
    }).then(pending => {
      result.pending = pending;
      return result;
    }).then(_result => {
      const executed = _result.executed.map(m => {
        m.name = path.basename(m.file, '.js');
        return m;
      });
      const pending = _result.pending.map(m => {
        m.name = path.basename(m.file, '.js');
        return m;
      });

      return {
        current: executed.length > 0 ? executed[0].file : null,
        executed: executed.map(m => m.file),
        pending: pending.map(m => m.file),
      };
    });
}

function cmdMigrate(umzug) {
  return umzug.up();
}

function cmdMigrateNext(umzug) {
  return cmdStatus(umzug)
    .then(_result => {
      if (_result.pending.length === 0) {
        return Promise.reject(new Error('No pending migrations'));
      }
      const next = _result.pending[0].name;
      return umzug.up({ to: next });
    });
}

function cmdReset(umzug) {
  return umzug.down({ to: 0 });
}

function cmdResetPrev(umzug) {
  return cmdStatus(umzug)
    .then(_result => {
      if (_result.executed.length === 0) {
        return Promise.reject(new Error('Already at initial state'));
      }
      const prev = _result.executed[_result.executed.length - 1].name;
      return umzug.down({ to: prev });
    });
}

module.exports = ($, argv, logger) => {
  const cwd = $.get('cwd', process.cwd());
  const dbs = Object.keys($.extensions.dbs);

  if (!argv.flags.use || dbs.indexOf(argv.flags.use) === -1) {
    throw new Error(`Missing connection to --use, given '${argv.flags.use}'`);
  }

  const models = $.extensions.dbs[argv.flags.use].models;
  const defns = $.extensions.dbs[argv.flags.use].refs;

  const schemas = path.join(cwd, 'db/schemas');
  const migrations = path.join(cwd, 'db/migrations');

  const fulldate = [
    new Date().getFullYear(),
    `0${new Date().getMonth() + 1}`.substr(-2),
    new Date().getDate(),
  ].join('');

  const hourtime = [
    `0${new Date().getHours()}`.substr(-2),
    `0${new Date().getMinutes()}`.substr(-2),
  ].join('');

  const fixedDeps = (argv._.length ? argv._ : Object.keys(models)).map(model => {
    if (!models[model]) {
      throw new Error(`Undefined model ${model}`);
    }

    return defns[model].$schema;
  });

  if (argv.flags.migrate) {
    if (argv.flags.export) {
      return Promise.all(fixedDeps.map(schema => {
        const name = typeof argv.flags.export === 'string'
          ? `_${argv.flags.snapshot.replace(/\W+/g, '_').toLowerCase()}`
          : `_create_${models[schema.id].tableName.toLowerCase()}`;

        const file = path.join(migrations, `${fulldate}_${hourtime}${name}.js`);

        return logger('write', path.relative(cwd, file), () => {
          // FIXME: use previous/latest schema instead
          const a = {};
          const b = models[schema.id].options.$schema;

          b._tableName = models[schema.id].tableName;

          fs.outputFileSync(file,
            JSONSchemaSequelizer.diff.build(a, b, JSONSchemaSequelizer.diff.map(a, b)));
        });
      }));
    }

    const conn = $.extensions.dbs[argv.flags.use];

    const Umzug = require('umzug');

    const umzug = new Umzug({
      storage: 'json',
      migrations: {
        params: [
          conn.sequelize.getQueryInterface(),
          conn.sequelize.constructor,
          conn.sequelize.Promise,
        ],
        path: migrations,
        pattern: /\.js$/,
        wrap: fn =>
          function $fn() {
            return (fn.apply(null, arguments) || [])
              .reduce((prev, cur) => prev.then(() => cur), Promise.resolve());
          },
      },
      logging() {
        logger.info('\r\r{% gray %s %}\n', Array.prototype.slice.call(arguments).join(' '));
      },
    });

    let executedCmd;

    switch (true) {
      case argv.flags.up:
        executedCmd = cmdMigrate(umzug);
        break;

      case argv.flags.next:
        executedCmd = cmdMigrateNext(umzug);
        break;

      case argv.flags.down:
        executedCmd = cmdReset(umzug);
        break;

      case argv.flags.prev:
        executedCmd = cmdResetPrev(umzug);
        break;

      default:
        executedCmd = cmdStatus(umzug);
        break;
    }

    return executedCmd
      .then(result => {
        if (!Array.isArray(result)) {
          // FIXME: better logs
          console.log(result);
        }
      });
  }

  if (argv.flags.snapshot) {
    if (argv.flags.import) {
      const all = glob.sync('**/*.json', { cwd: schemas });

      if (!all.length) {
        return logger.info('\r\r{% log No schemas were found %}\n');
      }

      const filename = path.join(schemas, all.pop());
      const payload = fs.readJsonSync(filename);
      const length = Object.keys(payload.definitions).length;

      logger('read', path.relative(cwd, filename));

      // FIXME: remove non-specified models from given list

      return $.extensions.dbs[argv.flags.use].migrate(payload)
        .then(() => {
          logger.info('\r\r{% log %s model%s imported %}\n',
            length,
            length === 1 ? '' : 's');
        });
    }

    const fixedRefs = {};

    Object.keys(defns).forEach(ref => {
      if (!models[ref]) {
        fixedRefs[ref] = defns[ref].$schema;
      }
    });

    const name = typeof argv.flags.snapshot === 'string'
      ? `_${argv.flags.snapshot.replace(/\W+/g, '_').toLowerCase()}`
      : '';

    const file = path.join(schemas, `${fulldate}_${hourtime}${name}.json`);

    return logger('write', path.relative(cwd, file), () =>
      fs.outputJsonSync(file, JSONSchemaSequelizer.bundle(fixedDeps, fixedRefs,
        typeof argv.flags.snapshot === 'string' && argv.flags.snapshot), { spaces: 2 }))
      .then(() => {
        logger.info('\r\r{% log %s model%s exported %}\n',
          fixedDeps.length,
          fixedDeps.length === 1 ? '' : 's');
      });
  }
};
