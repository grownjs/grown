'use strict';

const path = require('path');

module.exports = (Grown, util, ctx) => {
  const use = (ctx._ && ctx._[0]) || Grown.argv.flags.use;
  const only = (ctx._ && ctx.flags.only) || Grown.argv.flags.only;
  const dbName = (ctx._ && (ctx.flags.db || ctx.params.db)) || Grown.argv.flags.db;

  /* istanbul ignore else */
  if (!use || typeof use !== 'string') {
    throw new Error(`Missing models to --use, given '${use || ''}'`);
  }

  const database = path.resolve(Grown.cwd, use);
  const Models = Grown.use(require(database));
  const db = Models._getDB(dbName);

  const _allowed = only
    ? String(only).split(',')
    : [];

  Models._get = () =>
    Models._getModels()
      .filter(x => (_allowed.length ? _allowed.indexOf(x.name) !== -1 : true));

  Models._db = () => {
    return {
      sequelize: db.sequelize,
      schemas: db.$refs,
      models: Object.keys(db.models)
        .filter(x => (_allowed.length ? _allowed.indexOf(x.name) !== -1 : true))
        .map(x => db.models[x]),
    };
  };

  return Models;
};
