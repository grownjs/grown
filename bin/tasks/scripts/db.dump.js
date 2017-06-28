'use strict';

const path = require('path');
const glob = require('glob');
const fs = require('fs-extra');

const util = require('../../../bin/lib/util');

module.exports = ($, argv, logger) => {
  const cwd = $.get('cwd', process.cwd());

  const deps = util.sortModelsByRefs((argv._.length ? argv._ : Object.keys($.extensions.models)).map(name => {
    if (!$.extensions.models[name]) {
      throw new Error(`Undefined model ${name}`);
    }

    return $.extensions.models[name];
  }));

  if (argv.flags.load) {
    if (typeof argv.flags.load !== 'string') {
      throw new Error(`Invalid directory to --load, given '${argv.flags.load}'`);
    }

    const src = path.join(cwd, argv.flags.load);

    return Promise.all(deps
      .map(model => {
        const file = glob.sync(`**/${model}.json`, { cwd: src })[0];

        return $.extensions.models[model]
          .bulkCreate(fs.readJsonSync(path.join(src, file)))
          .then(() => {
            logger.info('{% item %s was loaded %}\r\n', model);
          })
          .catch(e => {
            logger.info('\r\r{% error %s %s %}\n', e.message, file);
          });
      }));
  }

  return Promise.all(deps
    .map(model => $.extensions.models[model]
      .findAll({ raw: true })
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
            new Date().getDate(),
          ].join('');

          const hourtime = [
            new Date().getHours(),
            `0${new Date().getMinutes()}`.substr(-2),
          ].join('');

          const file = path.join(cwd, argv.flags.save, fulldate, hourtime, `${result.model}.json`);

          return logger('write', path.relative(cwd, file), () => {
            fs.outputJsonSync(file, result.data);
          });
        }

        logger.write('\r\n--- BEGIN %s ---\n%s\n--- END %s ---\n',
          result.model, JSON.stringify(result.data, null, 2), result.model);
      });
    });
};
