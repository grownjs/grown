'use strict';

module.exports = (Grown, util) => {
  const Bundler = require('./bundler')(Grown, util);
  const Render = require('./render')(Grown, util);

  return Grown.module('Tarima', {
    include: [
      Bundler,
      Render,
    ],
  });
};
