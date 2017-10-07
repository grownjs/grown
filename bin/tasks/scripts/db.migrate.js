'use strict';

const path = require('path');
const glob = require('glob');
const fs = require('fs-extra');

const JSONSchemaSequelizer = require('json-schema-sequelizer');

module.exports = ($, argv, logger) => {
  const _extensions = $.extensions('Conn._');

  const cwd = $.config('cwd');
  const dbs = Object.keys(_extensions.dbs);

  if (!argv.flags.use || dbs.indexOf(argv.flags.use) === -1) {
    throw new Error(`Missing connection to --db, given '${argv.flags.use}'`);
  }

  const databaseDir = path.dirname(_extensions.dbs[argv.flags.use].sequelize.options.file);
  const schemaFile = path.join(databaseDir, 'schema.js');
  const baseDir = path.join(databaseDir, 'migrations');

  const models = _extensions.dbs[argv.flags.use].models;

  const fixedDeps = (argv._.length ? argv._ : Object.keys(models)).map(model => {
    if (!models[model]) {
      throw new Error(`Undefined model ${model}`);
    }

    return models[model];
  });

  if (!argv.flags.make) {
    const conn = _extensions.dbs[argv.flags.use].sequelize;

    const configFile = path.join(baseDir, 'index.json');

    fs.ensureDirSync(baseDir);

    if (argv.flags.create || argv.flags.destroy) {
      if (!fs.existsSync(schemaFile)) {
        throw new Error(`Missing ${schemaFile} file`);
      }

      const migrations = glob.sync('*.js', { cwd: baseDir });

      if (argv.flags.create) {
        fs.outputJsonSync(configFile, migrations, { spaces: 2 });
      } else {
        fs.outputFileSync(configFile, '[]');
      }

      return logger('read', path.relative(cwd, schemaFile), () =>
        JSONSchemaSequelizer.migrate(conn, require(schemaFile), true)[argv.flags.create ? 'up' : 'down']())
      .then(() => {
        logger.info('\r\r{% log %s schema %s %}\n', argv.flags.use, argv.flags.create ? 'applied' : 'reverted');
      });
    }

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

    return Promise.all([
      argv.flags.schema === true ? JSONSchemaSequelizer.generate({}, fixedDeps, true) : null,
      JSONSchemaSequelizer.migrate(conn, {
        configFile,
        baseDir,
        logging(message) {
          logger.info('\r\r{% gray %s %}\n', message);
        },
      })[method](params),
    ])
    .then(results => {
      const result = results[1];

      if (results[0]) {
        logger('write', path.relative(cwd, schemaFile), () => {
          fs.outputFileSync(schemaFile, results[0].code);
        });
      }

      if (!Array.isArray(result)) {
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

  const fulldate = [
    new Date().getFullYear(),
    `0${new Date().getMonth() + 1}`.substr(-2),
    `0${new Date().getDate() + 1}`.substr(-2),
  ].join('');

  const schema = path.join(databaseDir, 'schema.json');
  const dump = fs.existsSync(schema)
    ? fs.readJsonSync(schema)
    : {};

  return JSONSchemaSequelizer.generate(dump || {}, fixedDeps)
    .then(results => {
      if (!results.length) {
        logger.info('\r\r{% log Without changes %}\n');
        return;
      }

      results.forEach(result => {
        if (!result.code) {
          return;
        }

        const hourtime = [
          `0${new Date().getHours()}`.substr(-2),
          `0${new Date().getMinutes()}`.substr(-2),
          `0${new Date().getSeconds()}`.substr(-2),
          '.',
          `000${new Date().getMilliseconds()}`.substr(-3),
        ].join('');

        const name = typeof argv.flags.make === 'string'
          ? `_${argv.flags.make.replace(/\W+/g, '_').toLowerCase()}`
          : `_${result.code.indexOf('createTable') > -1 ? 'create' : 'update'}_${result.model.tableName.toLowerCase()}`;

        const file = path.join(baseDir, `${fulldate}${hourtime}${name}.js`);
        const src = path.relative(cwd, file);

        logger('write', src, () => {
          fs.outputFileSync(file, result.code);
        });
      });
    });
};
