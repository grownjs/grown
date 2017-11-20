'use strict';

module.exports = ($, util) => {
  const Controllers = require('./controllers')($, util);
  const Mappings = require('./mappings')($, util);

  return $.module('Router', {
    include: [
      Controllers,
      Mappings,
    ],
  });
};
