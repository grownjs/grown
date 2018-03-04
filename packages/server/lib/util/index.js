'use strict';

const _util = require('util');

const buildPipeline = require('../plug/pipeline');
const buildMiddleware = require('../plug/middleware');

module.exports = baseUtils => {
  const util = baseUtils.extendValues({}, baseUtils);

  _util._extend(util, require('./context')(util));
  _util._extend(util, {
    buildPipeline,
    buildMiddleware,
  });

  return util;
};
