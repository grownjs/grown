'use strict';

const objectUtil = require('./object');
const contextUtil = require('./context');

const buildPipeline = require('../plug/pipeline');
const buildMiddleware = require('../plug/middleware');

module.exports = {
  buildPipeline,
  buildMiddleware,
};

// merge all helpers
[
  objectUtil,
  contextUtil,
].forEach(helpers => {
  Object.keys(helpers).forEach(k => {
    module.exports[k] = helpers[k];
  });
});
