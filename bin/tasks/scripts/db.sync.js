'use strict';

const JSONSchemaSequelizer = require('json-schema-sequelizer');

module.exports = ($, argv, logger) => {
  const _opts = {};

  if (argv.flags.force === true) {
    _opts.force = true;
  } else {
    _opts.alter = true;
  }

  const deps = (argv._.length ? argv._ : Object.keys($.extensions.models)).map(name => {
    if (!$.extensions.models[name]) {
      throw new Error(`Undefined model ${name}`);
    }

    return $.extensions.models[name];
  });

  if (argv.flags.destroy === true) {
    return JSONSchemaSequelizer.deleteAll(deps, argv.flags, argv.data)
      .then(() => {
        logger.info('\r\r{% log %s model%s reset %}\n',
          deps.length,
          deps.length === 1 ? '' : 's');
      });
  }

  return JSONSchemaSequelizer.syncAll(deps, _opts)
    .then(() => {
      logger.info('\r\r{% log %s model%s synced %}\n',
        deps.length,
        deps.length === 1 ? '' : 's');
    });
};
