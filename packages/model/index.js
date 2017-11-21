'use strict';

module.exports = ($, util) => {
  const Repository = require('./repository')($, util);
  const Loader = require('./loader')($, util);

  return $.module('Model', {
    include: [
      Repository,
      Loader,
    ],
  });
};
