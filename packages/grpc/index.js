'use strict';

module.exports = (Grown, util) => {
  const Gateway = require('./gateway')(Grown, util);

  return Grown('GRPC', {
    include: [
      Gateway,
    ],
  });
};
