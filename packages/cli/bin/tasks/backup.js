'use strict';

const USAGE_INFO = `

Take and restore snapshots

--db    Database to be used, identifier
--use   Entry file exporting models

--load  Optional. Backup source, directory or file
--save  Optional. Backup destination, directory
--only  Optional. Models to reset by name

Examples:
  grown db.backup --use lib/my_app/database --force
  grown db.backup --use db/models --only Account,Session,User

`;

module.exports = {
  description: USAGE_INFO,
  callback(Grown, util) {
    const Models = require('../lib/models')(Grown, util);

    return Promise.resolve()
      .then(() => Models.connect())
      .then(() => Models.backup(Models._db(), {
        options: Grown.argv.flags,
        logger: Grown.Logger,
      }))
      .then(() => Models.disconnect());
  },
};
