'use strict';

module.exports = (Grown, util) => {
  const Req = require('./req')(Grown, util);
  const Res = require('./res')(Grown, util);

  return Grown.module('Test.Mock', {
    include: [
      Req,
      Res,
    ],
  });
};
