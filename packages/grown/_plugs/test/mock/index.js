'use strict';

module.exports = ($, util) => {
  const Req = require('./req')($, util);
  const Res = require('./res')($, util);

  return $.module('Test.Mock', {
    install(ctx) {
      ctx.plug([Req, Res]);
    },
  });
};
