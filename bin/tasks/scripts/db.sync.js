'use strict';

module.exports = ($, argv, logger) =>
  Promise.all((argv._.length ? argv._ : Object.keys($.extensions.models)).map(name => {
    if (!$.extensions.models[name]) {
      throw new Error(`Undefined model ${name}`);
    }

    return $.extensions.models[name].sync({
      force: argv.flags.force,
    }).then(() => {
      logger.info('{% item %s was synced %}\r\n', name);
    });
  }));
