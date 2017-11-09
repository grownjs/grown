'use strict';

module.exports = ($, util) => {
  const Mock = require('./mock')($, util);

  require('./core')($, util);

  return $.module('Test', {
    install(ctx) {
      ctx.plug(Mock);
    },
  });
};
