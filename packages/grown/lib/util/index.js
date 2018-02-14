'use strict';

const _util = require('util');
const util = require('@grown/bare/util');

const extraHelpers = require('./helpers');
const contextHelpers = require('./context');

_util._extend(util, extraHelpers);
_util._extend(util, contextHelpers);

const buildPipeline = require('../plug/pipeline');
const buildMiddleware = require('../plug/middleware');

_util._extend(util, {
  buildPipeline,
  buildMiddleware,
});

module.exports = util;
