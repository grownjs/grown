'use strict';

const path = require('path');

module.exports = (Grown, util, ctx) => {
  const use = (ctx && ctx._ && ctx._[0]) || Grown.argv.flags.use;
  const only = (ctx && ctx._ && ctx.flags.only) || Grown.argv.flags.only;
  const dbName = (ctx && ctx._ && (ctx.flags.db || ctx.params.db)) || Grown.argv.flags.db || 'default';

  /* istanbul ignore else */
  if (!use || typeof use !== 'string') {
    throw new Error(`Missing models to --use, given '${use || ''}'`);
  }

  const database = path.resolve(Grown.cwd, use);
  const Models = Grown.use(require(database));

  if (typeof Models._getDB !== 'function') {
    throw new Error(`Expecting Model.Repo, given '${Models.class}'`);
  }

  const db = Models._getDB(dbName);

  const _allowed = only
    ? String(only).split(',')
    : [];

  Models._get = () =>
    Object.keys(db.models)
      .filter(x => (_allowed.length ? _allowed.indexOf(x) !== -1 : true))
      .map(x => db.models[x]);

  Models._db = () => {
    return {
      sequelize: db.sequelize,
      schemas: db.$refs,
      models: Models._get(),
    };
  };

  return Models;
};
