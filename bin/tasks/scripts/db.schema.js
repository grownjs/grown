'use strict';

const path = require('path');
const fs = require('fs-extra');

const JSONSchemaSequelizer = require('json-schema-sequelizer');

module.exports = ($, argv, logger) => {
  const dbs = Object.keys($.dbs);

  if (!argv.flags.use || dbs.indexOf(argv.flags.use) === -1) {
    throw new Error(`Missing connection to --use, given '${argv.flags.use}'`);
  }

  const databaseDir = $.dbs[argv.flags.use].sequelize.options.baseDir;
  const schemaFile = path.join(databaseDir, 'schema.json');

  if (!fs.existsSync(schemaFile) && !argv.flags.save) {
    throw new Error('Missing schema.json definition');
  }

  if (!(argv.flags.save || argv.flags.load)) {
    const payload = fs.readJsonSync(schemaFile);

    const length = Object.keys(payload.definitions)
      .filter(x => $.models[x])
      .length;

    logger.info('\r\r{% star %s %}\n', payload.description);

    return logger.info('\r\r{% log %s model%s available %}\n',
      length,
      length === 1 ? '' : 's');
  }

  const models = $.dbs[argv.flags.use].models;
  const defns = $.dbs[argv.flags.use].refs;

  const fixedDeps = (argv._.length ? argv._ : Object.keys(models)).map(model => {
    if (!models[model]) {
      throw new Error(`Undefined model ${model}`);
    }

    return defns[model].$schema;
  });

  if (argv.flags.save) {
    const fixedRefs = {};

    Object.keys(defns).forEach(ref => {
      if (!models[ref]) {
        fixedRefs[ref] = defns[ref].$schema;
      }
    });

    return logger('write', path.relative($.cwd, schemaFile), () =>
      fs.outputJsonSync(schemaFile, JSONSchemaSequelizer.bundle(fixedDeps, fixedRefs,
        typeof argv.flags.save === 'string' && argv.flags.save), { spaces: 2 }))
      .then(() => {
        logger.info('\r\r{% log %s model%s exported %}\n',
          fixedDeps.length,
          fixedDeps.length === 1 ? '' : 's');
      });
  }

  if (argv.flags.load) {
    const payload = fs.readJsonSync(schemaFile);
    const length = Object.keys(payload.definitions)
      .filter(x => $.models[x])
      .length;

    logger('read', path.relative($.cwd, schemaFile));

    // FIXME: remove non-specified models from given list
    return $.dbs[argv.flags.use].rehydrate(payload)
      .then(() => {
        logger.info('\r\r{% log %s model%s imported %}\n',
          length,
          length === 1 ? '' : 's');
      });
  }
};
