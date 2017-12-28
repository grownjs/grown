'use strict';

const path = require('path');

module.exports = {
  description: 'Reset all models from database',
  callback(Grown, util) {
    if (!Grown.argv.flags.use || typeof Grown.argv.flags.use !== 'string') {
      throw new Error(`Missing models to --use, given '${Grown.argv.flags.use || ''}'`);
    }

    Grown.use(require('@grown/model'));

    const database = path.join(Grown.cwd, Grown.argv.flags.use);
    const factory = require(database);
    const Models = factory(Grown, util);

    const options = {
      force: Grown.argv.flags.force === true,
    };

    return Promise.resolve()
      .then(() => Models.connect())
      .then(() => Models.sync(options))
      .then(() => Models.disconnect());
  },
};
