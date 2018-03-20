'use strict';

module.exports = (Grown, util) => {
  const Views = require('./views')(Grown, util);
  const Layout = require('./layout')(Grown, util);
  const Actions = require('./actions')(Grown);

  return Grown('Render', {
    include: [
      Views,
      Layout,
      Actions,
    ],
  });
};
