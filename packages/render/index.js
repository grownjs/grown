'use strict';

module.exports = ($, util) => {
  const Views = require('./views')($, util);
  const Layout = require('./layout')($, util);

  return $.module('Render', {
    include: [
      Views,
      Layout,
    ],
  });
};
