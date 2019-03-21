'use strict';

module.exports = (Grown, util) => {
  const Handlers = require('./handlers')(Grown, util);
  const Gateway = require('./gateway')(Grown, util);

  return Grown('GRPC', {
    include: [
      Handlers,
      Gateway,
    ],
  });
};
