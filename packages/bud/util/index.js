'use strict';

const util = require('util');
const wargs = require('wargs');
const $new = require('object-new');

const _importer = require('./loader');
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
module.exports.load = _importer;
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

const IS_LOCKED = Symbol('$$locked');

module.exports.lock = obj => Object.assign(obj, IS_LOCKED, { value: 1 });
module.exports.locked = obj => obj && IS_LOCKED in obj;
module.exports.unlocked = obj => typeof obj === 'function' && !obj[IS_LOCKED];
