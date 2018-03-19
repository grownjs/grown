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
  grown migrate --use db/models one two three --up

NOTE: All additional arguments are taken as single migrations

`;

module.exports = {
  description: USAGE_INFO,
  callback(Grown, util) {
    const Models = require('../lib/models')(Grown, util);

    return Promise.resolve()
      .then(() => Models.connect())
      .then(() => Models.migrate({
        migrations: Grown.argv._.slice(),
        options: Grown.argv.flags,
        logger: Grown.Logger,
      }))
      .then(() => Models.disconnect());
  },
};
