'use strict';

module.exports = (Grown, util) => {
  const Formator = require('./Formator')(Grown);
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
