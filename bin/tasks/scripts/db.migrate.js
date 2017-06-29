'use strict';

const path = require('path');
const glob = require('glob');
const fs = require('fs-extra');

const JSONSchemaSequelizer = require('json-schema-sequelizer');

module.exports = ($, argv, logger) => {
  const cwd = $.get('cwd', process.cwd());
  const src = path.join(cwd, 'db/migrations');

  const dbs = Object.keys($.extensions.dbs);

  if (!argv.flags.use || dbs.indexOf(argv.flags.use) === -1) {
    throw new Error(`Missing connection to --use, given '${argv.flags.use}'`);
  }

  const models = $.extensions.dbs[argv.flags.use].sequelize.models;
  const deps = argv._.length ? argv._ : Object.keys(models);

  if (argv.flags.snapshot) {
    const fixedDeps = deps.map(model => {
      if (!models[model]) {
        throw new Error(`Undefined model ${model}`);
      }

      return models[model];
    });

    const fulldate = [
      new Date().getFullYear(),
      `0${new Date().getMonth() + 1}`.substr(-2),
      new Date().getDate(),
    ].join('');

    const hourtime = [
      `0${new Date().getHours()}`.substr(-2),
      `0${new Date().getMinutes()}`.substr(-2),
    ].join('');

    const name = typeof argv.flags.snapshot === 'string'
      ? `_${argv.flags.snapshot.replace(/\W+/g, '_').toLowerCase()}`
      : '';

    const file = path.join(src, `${fulldate}_${hourtime}${name}.json`);

    return logger('write', path.relative(cwd, file), () =>
      fs.outputJsonSync(file, JSONSchemaSequelizer.bundle(fixedDeps,
        typeof argv.flags.snapshot === 'string' && argv.flags.snapshot), { spaces: 2 }));
  }

  const all = glob.sync('**/*.json', { cwd: src });

  if (!all.length) {
    return logger.info('\r\r{% log No migrations found %}\n');
  }

  const payload = fs.readJsonSync(path.join(src, all.pop()));
  const length = Object.keys(payload.definitions).length;

  return $.extensions.dbs[argv.flags.use].migrate(payload)
    .then(() => {
      logger.info('\r\r{% log %s model%s migrated %}\n',
        length,
        length === 1 ? '' : 's');
    });
};
