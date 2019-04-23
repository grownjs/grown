'use strict';

module.exports = (Grown, util) => {
  const Formator = require('./formator')(Grown, util);
  const Repo = require('./repo')(Grown, util);
  const CLI = require('./cli')(Grown, util);
  const DB = require('./db')(Grown, util);

  return Grown('Model', {
    include: [
      Formator,
      Repo,
      CLI,
      DB,
    ],
  });
};
