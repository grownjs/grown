'use strict';

const path = require('path');

module.exports = (Grown, util, ctx) => {
  const use = (ctx && ctx._ && ctx._[0]) || Grown.argv.params.models;

  /* istanbul ignore else */
  if (!use || typeof use !== 'string') {
    throw new Error(`Missing models:PATH to load, given '${use || ''}'`);
  }

  return Grown.use(util.load(path.resolve(Grown.cwd, use)));
};
