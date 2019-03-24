'use strict';

const USAGE_INFO = `

Manage your snapshots

--db      Optional. Database to be used, identifier
--use     Optional. Entry file exporting models
--only    Optional. Filter out specific models

--import  Optional. Load into the database, directory or file
--export  Optional. Save backup to destination, directory

Examples:
  grown backup --load ../from/backup/or/path/to/seeds
  grown backup --save path/to/seeds --only Product,Cart

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
