'use strict';

module.exports = (Grown, util) => {
  const Formator = require('./formator')(Grown);
  const Repo = require('./repo')(Grown, util);
  const DB = require('./db')(Grown, util);

  require('./entity')(Grown, util);
  require('./cli')(Grown);

  return Grown('Model', {
    include: [
      Formator,
      Repo,
      DB,
    ],
  });
};
