'use strict';

module.exports = ($, util) => {
  const RequestTime = require('./request-time')($, util);
  const Response = require('./response')($, util);
  const Request = require('./request')($, util);

  return $.module('Conn', {
    include: [
      RequestTime,
      Response,
      Request,
    ],
  });
};
