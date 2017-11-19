'use strict';

module.exports = ($, util) => {
  const Controller = require('./controller')($, util);
  const Mappings = require('./mappings')($, util);

  return $.module('Router', {
    install(ctx) {
      ctx.plug([
        Controller,
        Mappings,
      ]);
    },
  });
};
