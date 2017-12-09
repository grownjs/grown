'use strict';

module.exports = (Grown, util) => {
  const URLENCODED = require('./urlencoded')(Grown, util);
  const JSON = require('./json')(Grown, util);

  return Grown.module('Parsers', {
    include: [
      URLENCODED,
      JSON,
    ],
  });
};
