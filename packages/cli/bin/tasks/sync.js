'use strict';

const USAGE_INFO = `

Update the database

--db     Database to be used, identifier
--use    Entry file exporting models

--only   Optional. Specific models to reset by name
--alter  Optional. Use ALTER instead of forcing
--force  Optional. Force synchronization

Examples:
  grown db.sync --use lib/my_app/database --force
  grown db.sync --use db/models --only Account,Session,User

`;

module.exports = {
  description: USAGE_INFO,
  callback(Grown, util) {
    const Models = require('../lib/models')(Grown, util);

    const options = {
      where: util.extendValues({}, Grown.argv.params, Grown.argv.data),
      force: Grown.argv.flags.force === true,
      alter: Grown.argv.flags.alter === true,
    };

    return Promise.resolve()
      .then(() => Models.connect())
      .then(() => {
        const _method = Grown.argv.flags.clear
          ? 'clear'
          : 'sync';

        /* istanbul ignore else */
        if (!Grown.argv.flags.only) {
          return Models[_method](Models._getModels(), options);
        }

        return Grown.argv.flags.only.split(',').reduce((prev, cur) => {
          return prev.then(() => {
            /* istanbul ignore else */
            if (_method === 'clear') {
              return Models[cur].destroy(options);
            }

            return Models[cur].sync(options);
          });
        }, Promise.resolve());
      })
      .then(() => Models.disconnect());
  },
};
