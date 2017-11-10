'use strict';

const util = require('util');

const objectUtil = require('./object');
const contextUtil = require('./context');

const buildPipeline = require('../plug/pipeline');
const buildMiddleware = require('../plug/middleware');

module.exports = {
  buildPipeline,
  buildMiddleware,
};

// merge all helpers
util._extend(module.exports, objectUtil);
util._extend(module.exports, contextUtil);
