'use strict';

module.exports = ($, argv, logger) => {
  const dbs = Object.keys($.extensions.dbs);

  return Promise.all(dbs.map(db => {
    logger.info('\r\r{% star %s %}\n', db);

    const models = Object.keys($.extensions.dbs[db].sequelize.models)
      .filter(m => (argv._.length ? argv._.indexOf(m) > -1 : true));

    return Promise.all(models.map(m => {
      return Promise.all([
        $.extensions.models[m].count(),
        argv.flags.inspect
          ? $.extensions.models[m].describe()
          : null,
      ])
      .then(results => {
        logger.info('\r\r  {% link %s %} {% gray (%s row%s) %}\n',
          m,
          results[0],
          results[0] === 1 ? '' : 's');

        Object.keys($.extensions.models[m].associations).forEach(ref => {
          const refs = $.extensions.models[m].associations;

          logger.info('    {% gray %s %} {% yellow %s %} %s\n',
            ref, refs[ref].associationType, refs[ref].target.name);
        });

        if (argv.flags.inspect) {
          Object.keys(results[1]).forEach(key => {
            logger.info('    {% gray %s %} {% yellow %s %}%s%s%s\n', key,
              results[1][key].type,
              results[1][key].allowNull ? '' : ' NOT_NULL',
              results[1][key].primaryKey ? ' PRIMARY_KEY' : '',
              results[1][key].defaultValue ? ` {% gray ${results[1][key].defaultValue} %}` : '');
          });
        }
      });
    }));
  }));
};
