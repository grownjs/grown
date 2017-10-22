'use strict';

const path = require('path');
const glob = require('glob');
const fs = require('fs-extra');

module.exports = ($, argv, logger) => {
  const _extensions = $.extensions('Conn._');

  const deps = (argv._.length ? argv._ : Object.keys(_extensions.models)).map(name => {
    if (!_extensions.models[name]) {
      throw new Error(`Undefined model ${name}`);
    }

    return _extensions.models[name];
  });

  if (argv.flags.load) {
    if (typeof argv.flags.load !== 'string') {
      throw new Error(`Invalid directory to --load, given '${argv.flags.load}'`);
    }

    const src = path.join($.cwd, argv.flags.load);

    return Promise.all(deps.map(model => {
      const file = glob.sync(`**/${model.name}.json`, { cwd: src })[0];

      return file && model
        .bulkCreate(fs.readJsonSync(path.join(src, file)))
        .then(() => {
          logger.info('{% item %s was loaded %}\r\n', model.name);
        })
        .catch(e => {
          logger.info('\r\r{% error %s (%s) %}\n', e.message, file);
        });
    }));
  }

  return Promise.all(deps
    .map(model => model
      .findAll({
        order: [[model.primaryKeyAttribute, 'ASC']],
        // FIXME: export nested-data instead?
        raw: true,
      })
      .then(data => ({ data, model }))))
    .then(results => {
      results.forEach(result => {
        if (argv.flags.save) {
          if (typeof argv.flags.save !== 'string') {
            throw new Error(`Invalid directory to --save, given '${argv.flags.save}'`);
          }

          const fulldate = [
            new Date().getFullYear(),
            `0${new Date().getMonth() + 1}`.substr(-2),
            `0${new Date().getDate() + 1}`.substr(-2),
          ].join('');

          const hourtime = [
            `0${new Date().getHours()}`.substr(-2),
            `0${new Date().getMinutes()}`.substr(-2),
            `0${new Date().getSeconds()}`.substr(-2),
            '.',
            `000${new Date().getMilliseconds()}`.substr(-3),
          ].join('');

          const file = path.join($.cwd, argv.flags.save, fulldate, hourtime, `${result.model.name}.json`);

          return logger('write', path.relative($.cwd, file), () => {
            fs.outputJsonSync(file, result.data, { spaces: 2 });
          });
        }

        logger.write('\r\n--- BEGIN %s ---\n%s\n--- END %s ---\n',
          result.model.name, JSON.stringify(result.data, null, 2), result.model.name);
      });
    });
};
