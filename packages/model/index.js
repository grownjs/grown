'use strict';

module.exports = (Grown, util) => {
  const Resource = require('./resource')(Grown, util);
  const Repo = require('./repo')(Grown, util);
  const CLI = require('./cli')(Grown, util);
  const DB = require('./db')(Grown, util);

  return Grown('Model', {
    include: [
      Resource,
      Repo,
      CLI,
      DB,
    ],
  });
};
