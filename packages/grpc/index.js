'use strict';

module.exports = (Grown, util) => {
  const Controllers = require('./controllers')(Grown, util);
  const Gateway = require('./gateway')(Grown, util);

  return Grown('GRPC', {
    include: [
      Controllers,
      Gateway,
    ],
  });
};
