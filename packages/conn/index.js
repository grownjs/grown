'use strict';

module.exports = ($, util) => {
  const RequestTime = require('./request-time')($, util);
  const Response = require('./response')($, util);
  const Helpers = require('./helpers')($, util);

  return $.module('Conn', {
    include: [
      RequestTime,
      Response,
      Helpers,
    ],
  });
};
