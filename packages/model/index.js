'use strict';

module.exports = ($, util) => {
  const Loader = require('./loader')($, util);
  const Repo = require('./repo')($, util);

  return $.module('Model', {
    include: [
      Loader,
      Repo,
    ],
  });
};
