'use strict';

module.exports = ($, util) => {
  const Res = require('./res')($, util);
  const Util = require('./util')($, util);

  return $.module('Conn', {
    include: [
      Res,
      Util,
    ],
  });
};
