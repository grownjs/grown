'use strict';

const USAGE_INFO = `

Manage your database

--models   Entry file exporting models

--only     Optional. Filter out specific models
--db       Optional. Database to be used, identifier

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
  grown migrate --make
  grown migrate --apply "migration description"

`;

const CACHED = {};

module.exports = {
  description: USAGE_INFO,
  callback(Grown, util) {
    const use = Grown.argv.flags.models;
    const db = Grown.argv.flags.db;

    /* istanbul ignore else */
    if (!use || typeof use !== 'string') {
      throw new Error(`Missing --models to load, given '${use || ''}'`);
    }

    if (!(Grown.Model && Grown.Model.CLI)) {
      Grown.use(require('@grown/model/cli'));
    }

    const path = require('path');

    const Models = !CACHED[use]
      ? (CACHED[use] = Grown.use(require(path.resolve(Grown.cwd, use))))
      : CACHED[use];

    const DB = Models._getDB(db);
    const cmd = Grown.argv._[0] || 'migrate';

    let _error;

    function run(cb) {
      if (cmd === 'migrate' || cmd === 'backup') {
        return cb(DB);
      }
    }

    function fail(e) {
      Grown.Logger.getLogger()
        .printf('\r{% error %s %}\r\n', e.stack);
    }

    return Promise.resolve()
      .then(() => run(x => x.connect()))
      .then(() => {
        if (cmd === 'migrate' || cmd === 'backup') {
          return run(x => Grown.Model.CLI.execute(x, cmd));
        }

        Grown.Logger.getLogger()
          .printf('\r{% error Unknown %s action, add --help for usage info %}\r\n', cmd);

        process.exit(1);
      })
      .catch(e => {
        fail(e);
        _error = true;
      })
      .then(() => run(x => x.close()))
      .catch(e => {
        fail(e);
        _error = true;
      })
      .then(() => {
        if (_error) {
          process.exit(1);
        }
      });
  },
};
