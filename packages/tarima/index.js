'use strict';

module.exports = ($, util) => {
  const Bundler = require('./bundler')($, util);
  const Render = require('./render')($, util);

  return $.module('Tarima', {
    include: [
      Bundler,
      Render,
    ],
  });
};
