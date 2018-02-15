'use strict';

module.exports = (Grown, util) => {
  const Controllers = require('./controllers')(Grown, util);
  const Gateway = require('./gateway')(Grown, util);
  const Loader = require('./loader')(Grown, util);

  return Grown('GRPC', {
    include: [
      Controllers,
      Gateway,
      Loader,
    ],
  });
};
