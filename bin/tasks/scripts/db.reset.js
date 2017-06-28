'use strict';

module.exports = ($, argv, logger) =>
  Promise.all((argv._.length ? argv._ : Object.keys($.extensions.models)).map(name => {
    if (!$.extensions.models[name]) {
      throw new Error(`Undefined model ${name}`);
    }

    return $.extensions.models[name]
      .destroy({
        truncate: argv.flags.truncate === true,
        where: Object.keys(argv.data).length
          ? argv.data
          : null,
      })
      .then(() => {
        logger.info('{% item %s was reset %}\r\n', name);
      });
  }));
