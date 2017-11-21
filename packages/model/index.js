'use strict';

module.exports = ($, util) => {
  const Loader = require('./loader')($, util);

  return $.module('Models', {
    include: [
      Loader,
    ],
  });
};
