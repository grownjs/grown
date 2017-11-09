'use strict';

module.exports = ($, util) => {
  const Req = require('./req')($, util);
  const Res = require('./res')($, util);

  $.module('Test.Mock', {
    install(ctx) {
      ctx.plug([Req, Res]);
    },
  });
};
