'use strict';

const util = require('util');
const wargs = require('wargs');
const $new = require('object-new');

const objectUtil = require('./object');
const processUtil = require('./process');
const helpersUtil = require('./helpers');

const buildPipeline = require('./plug/pipeline');
const buildMiddleware = require('./plug/middleware');

// definition helpers
module.exports = { ...$new };

// merge all helpers
util._extend(module.exports, objectUtil);
util._extend(module.exports, processUtil);
util._extend(module.exports, helpersUtil);

// common utils
module.exports.extend = util._extend;
module.exports.inspect = util.inspect;
module.exports.argvParser = wargs;

module.exports.buildPipeline = buildPipeline;
module.exports.buildMiddleware = buildMiddleware;

// object-new wrapper
module.exports.newContainer = () => function $(id, props, extensions) {
  return $new(id, props, $, extensions);
};

// the default logger interface is disabled
module.exports.getLogger = () => ({
  error() {},
  message() {},
});
