'use strict';

module.exports = (Grown, util) => {
  const Formator = require('./formator')(Grown);
  const DB = require('./db')(Grown, util);

  // register only
  require('./entity')(Grown, util);
  require('./cli')(Grown);

  return Grown('Model', {
    include: [
      Formator,
      DB,
    ],
  });
};
