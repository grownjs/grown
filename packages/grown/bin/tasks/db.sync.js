'use strict';

const path = require('path');

const USAGE_INFO = `

Reset models from given database

--use    Entry file exporting referenced models
--sync   Optional. Specific models to reset by name
--alter  Optional. Use ALTER instead of forcing
--force  Optional. Force synchronization

Examples:
  grown db.sync --use lib/my_app/database --force
  grown db.sync --use db/models --sync Account,Session,User

`;

module.exports = {
  description: USAGE_INFO,
  callback(Grown, util) {
    /* istanbul ignore else */
    if (!Grown.argv.flags.use || typeof Grown.argv.flags.use !== 'string') {
      throw new Error(`Missing models to --use, given '${Grown.argv.flags.use || ''}'`);
    }

    Grown.use(require('@grown/model'));

    const database = path.resolve(Grown.cwd, Grown.argv.flags.use);
    const factory = require(database);
    const Models = factory(Grown, util);

    const options = {
      force: Grown.argv.flags.force === true,
      alter: Grown.argv.flags.alter === true,
    };

    return Promise.resolve()
      .then(() => Models.connect())
      .then(() => {
        /* istanbul ignore else */
        if (!Grown.argv.flags.sync) {
          return Models.sync(options);
        }

        return Grown.argv.flags.sync.split(',').reduce((prev, cur) => {
          return prev.then(() => Models[cur].sync(options));
        }, Promise.resolve());
      })
      .then(() => Models.disconnect());
  },
};
