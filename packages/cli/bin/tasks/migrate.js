'use strict';

/* istanbul ignore file */

const path = require('path');

const USAGE_INFO = `

  Tasks for database management

  PATH  Entry file exporting models

  --only       Optional. Filter out specific models
  --db         Optional. Database to be used, identifier

  --make       Optional. Take an snapshot from your models
  --apply      Optional. Save changes from executed migrations

  --create     Optional. Create database from your schema
  --destroy    Optional. Drop the database entirely

  --up         Optional. Apply all pending migrations
  --down       Optional. Revert all applied migrations
  --next       Optional. Apply the latest pending migration
  --prev       Optional. Revert the latest applied migration

  --from       Optional. Apply migrations from this offset
  --to         Optional. Apply migrations up to this offset

  Examples:
    {bin} migrate path/to/models --make
    {bin} migrate db/models --apply "migration description"

`;

module.exports = {
  description: USAGE_INFO,
  callback(Grown, util) {
    const [main, use] = Grown.argv._;

    /* istanbul ignore else */
    if (!use || typeof use !== 'string') {
      throw new Error(`Missing PATH to load, given '${use || ''}'`);
    }

    return util.load(path.resolve(Grown.cwd, use))
      .then(container => (util.unlocked(container) ? container(Grown, util) : container))
      .then(Models => {
        if (!(Grown.Model && Grown.Model.CLI)) {
          throw new Error('Missing Grown.Model.CLI');
        }

        const DB = Object.assign(Models, { close: Models.disconnect });
        const cmd = main || 'migrate';

        let _error;

        function run(cb) {
          if (cmd === 'migrate' || cmd === 'backup') {
            return cb(DB);
          }
        }

        function fail(e) {
          Grown.Logger.getLogger()
            .printf('\r{% error. %s %}\n', (Grown.argv.flags.verbose && e.stack) || e.message);
        }

        return Promise.resolve()
          .then(() => run(x => x.connect()))
          .then(() => {
            if (cmd === 'migrate' || cmd === 'backup') {
              // discard cmd and use args!
              Grown.argv._ = Grown.argv._.slice(2);

              return run(x => Grown.Model.CLI.execute(x, cmd, Grown.argv));
            }

            Grown.Logger.getLogger()
              .printf('\r{% error. Unknown %s action, add --help for usage info %}\n', cmd);

            process.exit(1);
          })
          .catch(e => {
            fail(e);
            _error = true;
          })
          .then(() => run(x => x.close()))
          .catch(e => {
            fail(e);
            _error = true;
          })
          .then(() => {
            if (_error) {
              process.exit(1);
            }
          });
      });
  },
};
