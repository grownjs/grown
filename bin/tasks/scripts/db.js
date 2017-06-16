'use strict';

module.exports = ($, argv, logger) =>
  Promise.all((argv._.length ? argv._ : Object.keys($.extensions.models)).map(name => {
    const _model = $.extensions.models[name];

    if (!_model) {
      throw new Error(`Undefined model ${name}`);
    }

    return Promise.all([
      _model.count(),
      _model.describe(),
    ])
    .then(results => {
      logger.info('{% star %s %}\r\n', name);

      if (argv.flags.schema) {
        logger.info('%s\n', $.util.inspect(_model.definition.$schema)
          .replace(/"(.+?)"/g, '{% cyan "$1" %}'));
        return;
      }

      if (argv.flags.inspect) {
        Object.keys(results[1]).forEach(key => {
          logger.info('  {% item %s %} {% yellow %s %}%s%s%s\n', key,
            results[1][key].type,
            results[1][key].allowNull ? '' : ' NOT_NULL',
            results[1][key].primaryKey ? ' PRIMARY_KEY' : '',
            results[1][key].defaultValue ? ` {% gray ${results[1][key].defaultValue} %}` : '');
        });
        return;
      }

      logger.info('  {% gray count: %} %s\n', results[0]);

      logger.info('  {% gray fields: %} %s\n', $.util.inspect((_model.definition.$uiFields || [])
        .map(prop => prop.field)));

      logger.info('  {% gray references: %} %s\n', $.util.inspect(_model.refs));
    });
  }));
