'use strict';

module.exports = (Grown, util) => {
  const Gateway = require('./gateway')(Grown, util);
  const Loader = require('./loader')(Grown, util);

  return Grown('GRPC', {
    include: [
      Gateway,
      Loader,
    ],
  });
};
