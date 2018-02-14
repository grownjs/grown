'use strict';

const USAGE_INFO = `

Take and restore snapshots

--db    Database to be used, identifier
--use   Entry file exporting models

--load  Optional. Backup source, directory or file
--save  Optional. Backup destination, directory
--only  Optional. Models to reset by name

Examples:
  grown db.backup --use lib/my_app/database --force
  grown db.backup --use db/models --only Account,Session,User

`;

module.exports = {
  description: USAGE_INFO,
  callback(Grown, util) {
    const JSONSchemaSequelizer = require('json-schema-sequelizer');

    const Models = require('../lib/models')(Grown, util);

    const path = require('path');
    const glob = require('glob');
    const fs = require('fs-extra');

    function load() {
      /* istanbul ignore else */
      if (typeof Grown.argv.flags.load !== 'string') {
        throw new Error(`Invalid directory to --load, given '${Grown.argv.flags.load}'`);
      }

      const src = path.resolve(Grown.cwd, Grown.argv.flags.load);
      const after = path.resolve(path.dirname(src), Grown.argv.flags.after || 'after.js');
      const before = path.resolve(path.dirname(src), Grown.argv.flags.before || 'after.js');

      const _conn = Models._db();
      const _umzug = JSONSchemaSequelizer.migrate(_conn.sequelize);

      return Promise.resolve()
        .then(() => _umzug.run(before))
        .then(() => Promise.all(Object.keys(_conn.models)
          .map(x => _conn.models[x]).filter(x => !x.virtual)
          .map(x => {
            const file = glob.sync(`**/${x.name}.json`, { cwd: src })[0];

            /* istanbul ignore else */
            if (!file) {
              return util.logger.printf('{% item %s was skipped %}\r\n', x.name);
            }

            return x
              .bulkCreate(fs.readJsonSync(path.join(src, file)))
              .then(() => {
                util.logger.printf('{% item %s was loaded %}\r\n', x.name);
              });
          })))
        .then(() => _umzug.run(after));
    }

    function save() {
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

      return Promise.all(Models._get().filter(x => !x.virtual)
        .map(x => x
          .findAll({
            order: [[x.primaryKeyAttribute, 'ASC']],
            // FIXME: export nested-data instead?
            raw: true,
          })
          .then(data => ({ data, model: x }))))
        .then(results => {
          const _buffer = [];

          results.forEach(result => {
            /* istanbul ignore else */
            if (Grown.argv.flags.save) {
              /* istanbul ignore else */
              if (typeof Grown.argv.flags.save !== 'string') {
                throw new Error(`Invalid directory to --save, given '${Grown.argv.flags.save}'`);
              }

              const file = path.join(Grown.cwd, Grown.argv.flags.save, `${fulldate}${hourtime}`, `${result.model.name}.json`);

              return util.logger('write', path.relative(Grown.cwd, file), () => {
                fs.outputJsonSync(file, result.data, { spaces: 2 });
              });
            }

            _buffer.push(`\r\n--- BEGIN ${result.model.name} ---\n${JSON.stringify(result.data, null, 2)}\n--- END ${result.model.name} ---\n`);
          });

          /* istanbul ignore else */
          if (_buffer.length) {
            util.logger.write(`\r\r${_buffer.join('')}\n`);
          }
        });
    }

    return Promise.resolve()
      .then(() => Models.connect())
      .then(() => (Grown.argv.flags.load ? load() : save()))
      .then(() => Models.disconnect());
  },
};
