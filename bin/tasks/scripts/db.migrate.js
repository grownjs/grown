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

  const models = $.extensions.dbs[argv.flags.use].models;
  const defns = $.extensions.dbs[argv.flags.use].refs;

  if (argv.flags.snapshot) {
    const fixedDeps = (argv._.length ? argv._ : Object.keys(models)).map(model => {
      if (!models[model]) {
        throw new Error(`Undefined model ${model}`);
      }

      return defns[model].$schema;
    });

    const fixedRefs = {};

    Object.keys(defns).forEach(ref => {
      if (!models[ref]) {
        fixedRefs[ref] = defns[ref].$schema;
      }
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
      fs.outputJsonSync(file, JSONSchemaSequelizer.bundle(fixedDeps, fixedRefs,
        typeof argv.flags.snapshot === 'string' && argv.flags.snapshot), { spaces: 2 }))
      .then(() => {
        logger.info('\r\r{% log %s model%s exported %}\n',
          fixedDeps.length,
          fixedDeps.length === 1 ? '' : 's');
      });
  }

  const all = glob.sync('**/*.json', { cwd: src });

  if (!all.length) {
    return logger.info('\r\r{% log No migrations found %}\n');
  }

  const filename = path.join(src, all.pop());
  const payload = fs.readJsonSync(filename);
  const length = Object.keys(payload.definitions).length;

  logger('read', path.relative(cwd, filename));

  return $.extensions.dbs[argv.flags.use].migrate(payload)
    .then(() => {
      logger.info('\r\r{% log %s model%s imported %}\n',
        length,
        length === 1 ? '' : 's');
    });
};
