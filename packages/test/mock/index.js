'use strict';

module.exports = (Grown, util) => {
  const Req = require('./req')(Grown, util);
  const Res = require('./res')(Grown);

  return Grown('Test.Mock', {
    include: [
      Req,
      Res,
    ],
  });
};
