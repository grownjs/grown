'use strict';

module.exports = (Grown, util) => {
  const RequestTime = require('./request-time')(Grown, util);
  const Response = require('./response')(Grown, util);
  const Request = require('./request')(Grown, util);

  return Grown('Conn', {
    include: [
      RequestTime,
      Response,
      Request,
    ],
  });
};
