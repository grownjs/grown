'use strict';

const USAGE_INFO = `

Inspect models from given database

--use    Entry file exporting referenced models
--only   Optional. Specific models to inspect by name

Examples:
  grown db.inspect --use lib/my_app/database
  grown db.inspect --use db/models --only Account,Session,User

`;

module.exports = {
  description: USAGE_INFO,
  callback(Grown, util) {
    const Models = require('./_models')(Grown, util);

    return Models.connect()
      .then(() => {
        util.logger.info('\r\r{% star %s %} (%s)\n',
          Models.connection.database, Models.connection.dialect);

        const _models = Grown.argv.flags.only
          ? String(Grown.argv.flags.only).split(',')
          : [];

        return Promise.all(Models._getModels()
          .filter(x => (_models.length ? _models.indexOf(x.name) !== -1 : true))
          .map(x => {
            /* istanbul ignore else */
            if (x.virtual) {
              util.logger.info('\r\r{% link %s %} {% gray (virtual) %}\n', x.name);
            }

            return !x.virtual && Promise.all([
              x.count(),
              x.describe(),
            ])
              .then(results => {
                util.logger.info('\r\r{% link %s %} {% gray (%s row%s) %}\n',
                  x.name,
                  results[0],
                  results[0] === 1 ? '' : 's');

                Object.keys(x.associations).forEach(ref => {
                  const refs = x.associations;

                  util.logger.info('  {% gray %s %} {% yellow %s %} %s\n',
                    ref, refs[ref].associationType, refs[ref].target.name);
                });

                Object.keys(results[1]).forEach(key => {
                  util.logger.info('  {% gray %s %} {% yellow %s %}%s%s%s\n', key,
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
