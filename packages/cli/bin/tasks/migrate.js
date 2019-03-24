'use strict';

const USAGE_INFO = `

Manage your database

--db       Optional. Database to be used, identifier
--use      Optional. Entry file exporting models
--only     Optional. Filter out specific models

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

module.exports = {
  description: USAGE_INFO,
  callback(Grown, util) {
    if (!(Grown.Model && Grown.Model.CLI)) {
      Grown.use(require('@grown/model/cli'));
    }

    // const Models = Grown.use(require(path.resolve(Grown.cwd, Grown.argv.flags.use)));

    console.log(Models);
  },
};


// # const cmd = process.argv.slice(2)[0];

// # let _error;

// # function db(cb) {
// #   if (cmd === 'migrate' || cmd === 'backup') {
// #     return cb(Grown.Model.DB.default);
// #   }
// # }

// # Promise.resolve()
// #   .then(() => db(x => x.connect()))
// #   .then(() => {
// #     if (cmd === 'migrate' || cmd === 'backup') {
// #       return db(x => Grown.Model.CLI.execute(x));
// #     }

// #     process.stderr.write(`${Grown.Model.CLI.usage('bin/db')}\n`);
// #     process.exit(1);
// #   })
// #   .catch(e => {
// #     process.stderr.write(`${e.stack}\n`);
// #     _error = true;
// #   })
// #   .then(() => db(x => x.close()))
// #   .catch(e => {
// #     process.stderr.write(`${e.stack}\n`);
// #     _error = true;
// #   })
// #   .then(() => {
// #     if (_error) {
// #       process.exit(1);
// #     }
// #   });
// # #
