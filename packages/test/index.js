'use strict';

module.exports = ($, util) => {
  const Request = require('./request')($, util);
  const Mock = require('./mock')($, util);

  return $.module('Test', {
    include: [
      Request,
      Mock,
    ],
  });
};
