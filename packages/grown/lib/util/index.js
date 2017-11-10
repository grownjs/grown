'use strict';

const util = require('util');

const objectUtil = require('./object');
const contextUtil = require('./context');

const buildPipeline = require('../plug/pipeline');
const buildMiddleware = require('../plug/middleware');

// merge all helpers
util._extend(module.exports, objectUtil);
util._extend(module.exports, contextUtil);
util._extend(module.exports, {
  buildPipeline,
  buildMiddleware,
});
