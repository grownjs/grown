'use strict';

module.exports = (Grown, util) => {
  const Request = require('./request')(Grown);
  const Mock = require('./mock')(Grown, util);
  const Sockets = require('./sockets')(Grown, util);

  return Grown('Test', {
    include: [
      Sockets,
      Request,
      Mock,
    ],
  });
};
