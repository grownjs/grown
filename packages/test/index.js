'use strict';

module.exports = ($, util) => {
  const Request = require('./request')($, util);
  const Mock = require('./mock')($, util);

  return $.module('Test', {
    install(ctx) {
      ctx.plug([Request, Mock]);
    },
  });
};
