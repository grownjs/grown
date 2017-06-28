'use strict';

const util = require('../../../bin/lib/util');

module.exports = ($, argv, logger) => {
  const _opts = {};

  if (argv.flags.force === true) {
    _opts.force = true;
  } else {
    _opts.alter = true;
  }

  const deps = util.sortModelsByRefs((argv._.length ? argv._ : Object.keys($.extensions.models)).map(name => {
    if (!$.extensions.models[name]) {
      throw new Error(`Undefined model ${name}`);
    }

    return $.extensions.models[name];
  }));

  if (argv.flags.reset === true) {
    return Promise.all(deps.map(model => $.extensions.models[model].destroy({
      truncate: argv.flags.truncate === true,
      where: Object.keys(argv.data).length
        ? argv.data
        : null,
    })
    .then(() => {
      logger.info('{% item %s was reset %}\r\n', name);
    })));
  }

  return deps
    .reduce((prev, cur) => prev.then(() =>
      $.extensions.models[cur].sync(_opts)
        .catch(e => logger.info('\r\r{% failure %s %}\n', e.message))
        .then(() => {
          logger.info('{% item %s was synced %}\r\n', cur);
        })), Promise.resolve());
};
