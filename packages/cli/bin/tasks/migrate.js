'use strict';

const USAGE_INFO = `

Perform database changes

--db       Database to be used, identifier
--use      Entry file exporting models
--only     Optional. Specific models to reset by name

--make     Optional. Take an snapshot from your models
--apply    Optional. Save changes from executed migrations

--create   Optional. Create database from your schema
--destroy  Optional. Drop the database entirely

--up       Optional. Apply all pending migrations
--down     Optional. Revert all applied migrations
--next     Optional. Apply the latest pending migration
--prev     Optional. Revert the latest applied migration

--from     Optional. Apply migrations from this offset
--to       Optional. Apply migrations up to this offset

Examples:
  grown migrate --use db/models --apply "migration description"
  grown migrate --use db/models --from one --to three
  grown migrate --use db/models -- one two three

NOTE: All additional arguments after -- are taken as single migrations

`;

function fixedName(value) {
  return value
    .replace(/([A-Z])/g, (_, $1) => `_${$1}`)
    .replace(/\W+/g, '_')
    .toLowerCase();
}

module.exports = {
  description: USAGE_INFO,
  callback(Grown, util) {
    const Models = require('../lib/models')(Grown, util);

    const JSONSchemaSequelizer = require('json-schema-sequelizer');

    const path = require('path');
    const glob = require('glob');
    const fs = require('fs-extra');

    return Promise.resolve()
      .then(() => Models.connect())
      .then(() => {
        const _db = Models._db();
        const _conn = _db.sequelize;
        const _baseDir = _conn.options.directory;
        const _identifier = _conn.options.identifier;

        /* istanbul ignore else */
        if (!fs.existsSync(_baseDir)) {
          throw new Error(`Missing ${_baseDir} directory`);
        }

        const schemaFile = path.join(_baseDir, 'schema.js');
        const schemaJson = path.join(_baseDir, 'schema.json');
        const migrationsDir = path.join(_baseDir, 'migrations');
        const migrationsFile = path.join(migrationsDir, 'index.json');

        function upgrade() {
          const fixedRefs = {};

          Object.keys(_db.schemas).forEach(ref => {
            /* istanbul ignore else */
            if (!_db.models[ref]) {
              fixedRefs[ref] = _db.schemas[ref].$schema;
            }
          });

          return util.logger('write', path.relative(Grown.cwd, schemaJson), () =>
            fs.outputJsonSync(schemaJson, JSONSchemaSequelizer.bundle(_db.models, fixedRefs,
              typeof Grown.argv.flags.apply === 'string' && Grown.argv.flags.apply), { spaces: 2 }))
            .then(() => {
              util.logger.printf('\r\r{% log %s model%s exported %}\n',
                _db.models.length,
                _db.models.length === 1 ? '' : 's');
            });
        }

        function reset() {
          /* istanbul ignore else */
          if (!fs.existsSync(schemaFile)) {
            throw new Error(`Missing ${schemaFile} file`);
          }

          const migrations = glob.sync('*.js', { cwd: migrationsDir });

          if (Grown.argv.flags.create) {
            fs.outputJsonSync(migrationsFile, migrations, { spaces: 2 });
          } else {
            fs.outputFileSync(migrationsFile, '[]');
          }

          return util.logger('read', path.relative(Grown.cwd, schemaFile), () =>
            JSONSchemaSequelizer.migrate(_conn, require(schemaFile), true)[Grown.argv.flags.create ? 'up' : 'down']())
            .then(() => {
              util.logger.printf('\r\r{% log %s %s %}\n', Grown.argv.flags.use, Grown.argv.flags.create ? 'applied' : 'reverted');
            });
        }

        function write() {
          const fulldate = [
            new Date().getFullYear(),
            `0${new Date().getMonth() + 1}`.substr(-2),
            `0${new Date().getDate() + 1}`.substr(-2),
          ].join('');

          const dump = fs.existsSync(schemaJson)
            ? fs.readJsonSync(schemaJson)
            : {};

          return JSONSchemaSequelizer.generate(dump || {}, _db.models)
            .then(results => {
              /* istanbul ignore else */
              if (!results.length) {
                util.logger.printf('\r\r{% log Without changes %}\n');
                return;
              }

              results.forEach(result => {
                /* istanbul ignore else */
                if (!result.code) {
                  return;
                }

                const hourtime = [
                  `0${new Date().getHours()}`.substr(-2),
                  `0${new Date().getMinutes()}`.substr(-2),
                  `0${new Date().getSeconds()}`.substr(-2),
                  '.',
                  `000${new Date().getMilliseconds()}`.substr(-3),
                ].join('');

                const name = typeof Grown.argv.flags.make === 'string'
                  ? `_${fixedName(Grown.argv.flags.make)}`
                  : `_${result.code.indexOf('createTable') > -1 ? 'create' : 'update'}${fixedName(result.model.tableName)}`;

                const file = path.join(migrationsDir, `${fulldate}${hourtime}${name}.js`);
                const src = path.relative(Grown.cwd, file);

                util.logger('write', src, () => {
                  fs.outputFileSync(file, result.code);
                });
              });
            });
        }

        function check() {
          let method = 'status';

          const params = {};

          ['up', 'down', 'prev', 'next'].forEach(key => {
            /* istanbul ignore else */
            if (Grown.argv.flags[key]) {
              method = key;

              /* istanbul ignore else */
              if (typeof Grown.argv.flags[key] === 'string') {
                params.migrations = params.migrations || [];
                params.migrations.push(Grown.argv.flags[key]);
              }
            }
          });

          ['from', 'to'].forEach(key => {
            /* istanbul ignore else */
            if (typeof Grown.argv.flags[key] === 'string') {
              params[key] = Grown.argv.flags[key];
            }
          });

          /* istanbul ignore else */
          if (Grown.argv.raw.length) {
            params.migrations = Grown.argv.raw;
          }

          return Promise.all([
            Grown.argv.flags.apply
              ? JSONSchemaSequelizer.generate({}, _db.models, true)
              : null,
            JSONSchemaSequelizer.migrate(_conn, {
              configFile: migrationsFile,
              baseDir: migrationsDir,
              logging(message) {
                util.logger.printf('\r\r{% gray %s %}\n', message);
              },
            })[method](params),
          ])
            .then(results => {
              const result = results[1];

              /* istanbul ignore else */
              if (results[0]) {
                util.logger('write', path.relative(Grown.cwd, schemaFile), () => {
                  fs.outputFileSync(schemaFile, results[0].code);
                });
              }

              if (!Array.isArray(result)) {
                /* istanbul ignore else */
                if (result.executed && result.executed.length === 0) {
                  util.logger.printf('\r\r{% log No executed migrations %}\n');
                }

                /* istanbul ignore else */
                if (result.pending && result.pending.length) {
                  util.logger.printf('\r\r{% log Pending migrations: %}\n');

                  result.pending.forEach(x => {
                    util.logger.printf('{% yellow.line %s %}\n', x);
                  });
                }

                /* istanbul ignore else */
                if (result.pending && result.pending.length === 0) {
                  util.logger.printf('\r\r{% log No pending migrations %}\n');
                }
              } else if (!result.length) {
                util.logger.printf('\r\r{% log No changes were made %}\n');
              } else {
                util.logger.printf('\r\r{% log %s migration%s %s %s %}\n',
                  result.length,
                  result.length === 1 ? '' : 's',
                  result.length === 1 ? 'was' : 'were',
                  Grown.argv.flags.up || Grown.argv.flags.next ? 'applied' : 'reverted');
              }
            });
        }

        /* istanbul ignore else */
        if (Grown.argv.flags.create || Grown.argv.flags.destroy) {
          return reset();
        }

        /* istanbul ignore else */
        if (Grown.argv.flags.apply) {
          return upgrade().then(check);
        }

        /* istanbul ignore else */
        if (Grown.argv.flags.make) {
          return write();
        }

        return check();
      })
      .catch(Grown.CLI._onError)
      .then(() => Models.disconnect())
  },
};
