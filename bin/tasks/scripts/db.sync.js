'use strict';

module.exports = ($, argv, logger) => {
  const _opts = {};

  if (argv.flags.force) {
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

  return deps
    .sort((a, b) => Object.keys(a.refs).length - Object.keys(b.refs).length)
    .reduce((prev, cur) => prev.then(() =>
      cur.sync(_opts)
        .then(() => {
          logger.info('{% item %s was synced %}\r\n', cur.name);
        })), Promise.resolve());
};
