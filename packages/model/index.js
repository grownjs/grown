'use strict';

module.exports = (Grown, util) => {
  const Resource = require('./resource')(Grown, util);
  const Loader = require('./loader')(Grown, util);
  const Repo = require('./repo')(Grown, util);

  return Grown.module('Model', {
    include: [
      Resource,
      Loader,
      Repo,
    ],
  });
};
