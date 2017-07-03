'use strict';

const path = require('path');
const glob = require('glob');
const fs = require('fs-extra');

const JSONSchemaSequelizer = require('json-schema-sequelizer');

module.exports = ($, argv, logger) => {
  const cwd = $.get('cwd', process.cwd());
  const dbs = Object.keys($.extensions.dbs);

  const baseDir = path.join(cwd, 'db/schemas');

  const all = glob.sync('**/*.json', { cwd: baseDir });

  if (!all.length) {
    return logger.info('\r\r{% log No schemas were found %}\n');
  }

  if (!(argv.flags.save || argv.flags.load)) {
    logger.info('\r\r{% gray Available schemas: %}\n');

    all.forEach(x => {
      logger.info('{% yellow.line %s %}\n', x);
    });
    return;
  }

  if (!argv.flags.use || dbs.indexOf(argv.flags.use) === -1) {
    throw new Error(`Missing connection to --use, given '${argv.flags.use}'`);
  }

  const models = $.extensions.dbs[argv.flags.use].models;
  const defns = $.extensions.dbs[argv.flags.use].refs;

  const fulldate = [
    new Date().getFullYear(),
    `0${new Date().getMonth() + 1}`.substr(-2),
    `0${new Date().getDate() + 1}`.substr(-2),
  ].join('');

  const hourtime = [
    `0${new Date().getHours()}`.substr(-2),
    `0${new Date().getMinutes()}`.substr(-2),
    '.',
    `0${new Date().getSeconds()}`.substr(-2),
    `000${new Date().getMilliseconds()}`.substr(-3),
  ].join('');

  const fixedDeps = (argv._.length ? argv._ : Object.keys(models)).map(model => {
    if (!models[model]) {
      throw new Error(`Undefined model ${model}`);
    }

    return defns[model].$schema;
  });

  fs.ensureDirSync(baseDir);

  if (argv.flags.save) {
    const fixedRefs = {};

    Object.keys(defns).forEach(ref => {
      if (!models[ref]) {
        fixedRefs[ref] = defns[ref].$schema;
      }
    });

    const name = typeof argv.flags.save === 'string'
      ? `_${argv.flags.save.replace(/\W+/g, '_').toLowerCase()}`
      : '';

    const file = path.join(baseDir, `${fulldate}${hourtime}${name}.json`);

    return logger('write', path.relative(cwd, file), () =>
      fs.outputJsonSync(file, JSONSchemaSequelizer.bundle(fixedDeps, fixedRefs,
        typeof argv.flags.save === 'string' && argv.flags.save), { spaces: 2 }))
      .then(() => {
        logger.info('\r\r{% log %s model%s exported %}\n',
          fixedDeps.length,
          fixedDeps.length === 1 ? '' : 's');
      });
  }

  if (argv.flags.load) {
    const filename = path.join(baseDir, all.pop());
    const payload = fs.readJsonSync(filename);
    const length = Object.keys(payload.definitions).length;

    logger('read', path.relative(cwd, filename));

    // FIXME: remove non-specified models from given list

    return $.extensions.dbs[argv.flags.use].rehydrate(payload)
      .then(() => {
        logger.info('\r\r{% log %s model%s imported %}\n',
          length,
          length === 1 ? '' : 's');
      });
  }
};
