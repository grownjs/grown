'use strict';

module.exports = (Grown, util) => {
  const URLENCODED = require('./urlencoded')(Grown, util);
  const JSON = require('./json')(Grown, util);

  // register only
  require('./text')(Grown, util);
  require('./raw')(Grown, util);

  return Grown('Parsers', {
    include: [
      URLENCODED,
      JSON,
    ],
  });
};
