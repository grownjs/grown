'use strict';

const path = require('path');
const fs = require('fs-extra');

const JSONSchemaSequelizer = require('json-schema-sequelizer');

// FIXME: how to create next-diff from current schemas?
// the latest schema is given by the "schemas/*.json"
// and the current schema is from model.options.$schema

module.exports = ($, argv, logger) => {
  const cwd = $.get('cwd', process.cwd());
  const dbs = Object.keys($.extensions.dbs);

  const baseDir = path.join(cwd, 'db/migrations');

  if (!argv.flags.save) {
    if (!argv.flags.use || dbs.indexOf(argv.flags.use) === -1) {
      throw new Error(`Missing connection to --use, given '${argv.flags.use}'`);
    }

    const configFile = path.join(cwd, 'db/migrations.json');

    fs.ensureDirSync(baseDir);

    let method = 'status';

    const params = {};

    ['up', 'down', 'prev', 'next'].forEach(key => {
      if (argv.flags[key]) {
        method = key;

        if (typeof argv.flags[key] === 'string') {
          params.migrations = params.migrations || [];
          params.migrations.push(argv.flags[key]);
        }
      }
    });

    ['from', 'to'].forEach(key => {
      if (typeof argv.flags[key] === 'string') {
        params[key] = argv.flags[key];
      }
    });

    if (argv.raw.length) {
      params.migrations = argv.raw;
    }

    return JSONSchemaSequelizer.migrate($.extensions.dbs[argv.flags.use].sequelize, {
      configFile,
      baseDir,
      logging(message) {
        logger.info('\r\r{% gray %s %}\n', message);
      },
    })[method](params).then(result => {
      if (!Array.isArray(result)) {
        if (result.executed && result.executed.length) {
          logger.info('\r\r{% log Executed migrations: %}\n');

          result.executed.forEach(x => {
            logger.info('{% cyan.line %s %}\n', x);
          });
        }

        if (result.executed && result.executed.length === 0) {
          logger.info('\r\r{% log No executed migrations %}\n');
        }

        if (result.pending && result.pending.length) {
          logger.info('\r\r{% log Pending migrations: %}\n');

          result.pending.forEach(x => {
            logger.info('{% yellow.line %s %}\n', x);
          });
        }

        if (result.pending && result.pending.length === 0) {
          logger.info('\r\r{% log No pending migrations %}\n');
        }
      } else if (!result.length) {
        logger.info('\r\r{% log No changes were made %}\n');
      } else {
        logger.info('\r\r{% log %s migration%s %s %s %}\n',
          result.length,
          result.length === 1 ? '' : 's',
          result.length === 1 ? 'was' : 'were',
          argv.flags.up || argv.flags.next ? 'applied' : 'reverted');
      }
    });
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

  const fixedDeps = (argv._.length ? argv._ : Object.keys(models)).map(model => {
    if (!models[model]) {
      throw new Error(`Undefined model ${model}`);
    }

    return defns[model].$schema;
  });

  return Promise.all(fixedDeps.map(schema => {
    const hourtime = [
      `0${new Date().getHours()}`.substr(-2),
      `0${new Date().getMinutes()}`.substr(-2),
      '.',
      `0${new Date().getSeconds()}`.substr(-2),
      `000${new Date().getMilliseconds()}`.substr(-3),
    ].join('');

    const name = typeof argv.flags.save === 'string'
      ? `_${argv.flags.save.replace(/\W+/g, '_').toLowerCase()}`
      : `_create_${models[schema.id].tableName.toLowerCase()}`;

    const file = path.join(baseDir, `${fulldate}${hourtime}${name}.js`);

    return logger('write', path.relative(cwd, file), () => {
      // FIXME: use previous/latest schema instead
      const a = {};
      const b = models[schema.id].options.$schema;

      b._tableName = models[schema.id].tableName;

      fs.outputFileSync(file, JSONSchemaSequelizer.generate(a, b));
    });
  }));
};
