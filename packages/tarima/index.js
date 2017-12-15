'use strict';

module.exports = (Grown, util) => {
  const Bundler = require('./bundler')(Grown, util);
  const Render = require('./render')(Grown, util);

  return Grown('Tarima', {
    include: [
      Bundler,
      Render,
    ],
  });
};
