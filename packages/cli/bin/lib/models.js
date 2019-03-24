'use strict';

const path = require('path');

module.exports = (Grown, util, ctx) => {
  const use = (ctx && ctx._ && ctx._[0]) || Grown.argv.flags.use;
  const dbName = (ctx && ctx._ && (ctx.flags.db || ctx.params.db)) || Grown.argv.flags.db || 'default';

  /* istanbul ignore else */
  if (!use || typeof use !== 'string') {
    throw new Error(`Missing models to --use, given '${use || ''}'`);
  }

  return Grown.use(require(path.resolve(Grown.cwd, use)));
};
