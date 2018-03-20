'use strict';

module.exports = Grown => {
  const URLENCODED = require('./urlencoded')(Grown);
  const JSON = require('./json')(Grown);

  // register only
  require('./text')(Grown);
  require('./raw')(Grown);

  return Grown('Parsers', {
    include: [
      URLENCODED,
      JSON,
    ],
  });
};
