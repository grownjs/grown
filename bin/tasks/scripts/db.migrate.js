'use strict';

const path = require('path');
const glob = require('glob');
const fs = require('fs-extra');

const util = require('../../../bin/lib/util');

module.exports = ($, argv, logger) => {
  const cwd = $.get('cwd', process.cwd());
  const src = path.join(cwd, 'db/migrations');

  /*

  FIXME (all can have values):

  grown db.migrate [--latest]  # apply latest migration
  grown db.migrate --snapshot  # save current schema
  grown db.mgirate --rollback  # revert last applied migration

  if a value is given, then it will apply the given schema instead of latest/current

  */

  if (argv.flags.rollback) {
    return;
  }

  if (argv.flags.snapshot) {
    const fulldate = [
      new Date().getFullYear(),
      `0${new Date().getMonth() + 1}`.substr(-2),
      new Date().getDate(),
    ].join('');

    const hourtime = [
      new Date().getHours(),
      `0${new Date().getMinutes()}`.substr(-2),
    ].join('');

    const name = typeof argv.flags.snapshot === 'string'
      ? `_${argv.flags.snapshot.replace(/\W+/g, '_').toLowerCase()}`
      : '';

    const file = path.join(src, `${fulldate}_${hourtime}${name}.json`);

    return logger('write', path.relative(cwd, file), () => {
      const schemas = {};

      util.sortModelsByRefs((argv._.length ? argv._ : Object.keys($.extensions.models)).map(model => {
        if (!$.extensions.models[model]) {
          throw new Error(`Undefined model ${model}`);
        }

        return $.extensions.models[model];
      }))
      .forEach(model => {
        schemas[$.extensions.models[model].name] = {
          schema: $.extensions.models[model].options.$schema,
          options: {
            paranoid: $.extensions.models[model].options.paranoid,
          },
        };
      });

      fs.outputJsonSync(file, {
        description: typeof argv.flags.snapshot !== 'string'
          ? new Date().toISOString()
          : argv.flags.snapshot,
        definitions: schemas,
      }, { spaces: 2 });
    });
  }

  const all = glob.sync('**/*.json', { cwd: src });

  if (all.length) {
    const models = fs.readJsonSync(path.join(src, all.pop()));
    const types = require('json-schema-sequelizer/lib/types');

    return Promise.all(Object.keys(models.definitions).map(model => {
      return $.extensions.models[model].sequelize
        .define(model, types.convertSchema(models.definitions[model].schema).props, models.definitions[model].options)
        .sync({ force: true })
        .then(() => {
          logger.info('\r\r{% gray %s was migrated %}\n', model);
        });
    }));
  }
};
