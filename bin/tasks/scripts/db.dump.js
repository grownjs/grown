'use strict';

const path = require('path');
const fs = require('fs-extra');

module.exports = ($, argv, logger) => {
  return Promise.all((argv._.length ? argv._ : Object.keys($.extensions.models)).map(name => {
    if (!$.extensions.models[name]) {
      throw new Error(`Undefined model ${name}`);
    }

    return $.extensions.models[name]
      .findAll({ raw: true })
      .then(data => ({ data, name }));
  }))
  .then(results => {
    const cwd = $.get('cwd', process.cwd());
    const dest = path.join(cwd, argv.flags.save);

    results.forEach(result => {
      if (argv.flags.save) {
        if (typeof argv.flags.save !== 'string') {
          throw new Error(`Invalid directory to --save, given '${argv.flags.save}'`);
        }

        const fulldate = [
          new Date().getFullYear(),
          `0${new Date().getMonth() + 1}`.substr(-2),
          new Date().getDate(),
        ].join('');

        const hourtime = [
          new Date().getHours(),
          `0${new Date().getMinutes()}`.substr(-2),
        ].join('');

        const file = path.join(dest, fulldate, hourtime, `${result.name}.json`);

        return logger('write', path.relative(cwd, file), () => {
          fs.outputJsonSync(file, result.data);
        });
      }

      logger.write('\r\n--- BEGIN %s ---\n%s\n--- END %s ---\n',
        result.name, JSON.stringify(result.data, null, 2), result.name);
    });
  });
};
