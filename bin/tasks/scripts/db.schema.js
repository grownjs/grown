'use strict';

const path = require('path');
const fs = require('fs-extra');

const JSONSchemaSequelizer = require('json-schema-sequelizer');

module.exports = ($, argv, logger) => {
  const _extensions = $.extensions('Conn._');

  const cwd = $.get('cwd', process.cwd());
  const dbs = Object.keys(_extensions.dbs);

  if (!argv.flags.db || dbs.indexOf(argv.flags.db) === -1) {
    throw new Error(`Missing connection to --db, given '${argv.flags.db}'`);
  }

  const databaseDir = path.join(cwd, argv.flags.path || 'db', argv.flags.db);
  const schemaFile = path.join(databaseDir, 'schema.json');

  if (!fs.existsSync(schemaFile) && !argv.flags.save) {
    throw new Error('Missing schema.json definition');
  }

  if (!(argv.flags.save || argv.flags.load)) {
    const payload = fs.readJsonSync(schemaFile);

    const length = Object.keys(payload.definitions)
      .filter(x => _extensions.models[x])
      .length;

    logger.info('\r\r{% star %s %}\n', payload.description);

    return logger.info('\r\r{% log %s model%s available %}\n',
      length,
      length === 1 ? '' : 's');
  }

  const models = _extensions.dbs[argv.flags.db].models;
  const defns = _extensions.dbs[argv.flags.db].refs;

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

    return logger('write', path.relative(cwd, schemaFile), () =>
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
      .filter(x => _extensions.models[x])
      .length;

    logger('read', path.relative(cwd, schemaFile));

    // FIXME: remove non-specified models from given list
    return _extensions.dbs[argv.flags.db].rehydrate(payload)
      .then(() => {
        logger.info('\r\r{% log %s model%s imported %}\n',
          length,
          length === 1 ? '' : 's');
      });
  }
};
