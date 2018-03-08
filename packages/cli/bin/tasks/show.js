'use strict';

const USAGE_INFO = `

Inspect the database

--db     Database to be used, identifier
--use    Entry file exporting models
--only   Optional. Models to inspect by name

Examples:
  grown db.inspect --use lib/my_app/database
  grown db.inspect --use db/models --only Account,Session,User

`;

module.exports = {
  description: USAGE_INFO,
  callback(Grown, util) {
    const Models = require('../lib/models')(Grown, util);

    const logger = Grown.Logger.getLogger();

    return Models.connect()
      .then(() => {
        logger.printf('\r\r{% star %s %} (%s)\n',
          Models.connection.database, Models.connection.dialect);

        return Promise.all(Models._get()
          .map(x => {
            /* istanbul ignore else */
            if (x.virtual) {
              logger.printf('\r\r{% link %s %} {% gray (virtual) %}\n', x.name);
            }

            return !x.virtual && Promise.all([
              x.count(),
              x.describe(),
            ])
              .then(results => {
                logger.printf('\r\r{% link %s %} {% gray (%s row%s) %}\n',
                  x.name,
                  results[0],
                  results[0] === 1 ? '' : 's');

                Object.keys(x.associations).forEach(ref => {
                  const refs = x.associations;

                  logger.printf('  {% gray %s %} {% yellow %s %} %s\n',
                    ref, refs[ref].associationType, refs[ref].target.name);
                });

                Object.keys(results[1]).forEach(key => {
                  logger.printf('  {% gray %s %} {% yellow %s %}%s%s%s\n', key,
                    results[1][key].type,
                    results[1][key].allowNull ? '' : ' NOT_NULL',
                    results[1][key].primaryKey ? ' PRIMARY_KEY' : '',
                    results[1][key].defaultValue ? ` {% gray ${results[1][key].defaultValue} %}` : '');
                });
              });
          }))
          .then(() => Models.disconnect());
      });
  },
};
