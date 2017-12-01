'use strict';

module.exports = ($, util) => {
  const Views = require('./views')($, util);
  const Layout = require('./layout')($, util);
  const Actions = require('./actions')($, util);

  return $.module('Render', {
    include: [
      Views,
      Layout,
      Actions,
    ],
  });
};
