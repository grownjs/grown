'use strict';

const util = require('util');
const wargs = require('wargs');
const $new = require('object-new');

const objectUtil = require('./object');
const processUtil = require('./process');
const helpersUtil = require('./helpers');

// merge all helpers
util._extend(module.exports, objectUtil);
util._extend(module.exports, processUtil);
util._extend(module.exports, helpersUtil);

// merge definition helpers
Object.keys($new).forEach(key => {
  module.exports[key] = $new[key];
});

// common utils
module.exports.inspect = util.inspect;
module.exports.argvParser = wargs;

// object-new wrapper
module.exports.newContainer = () =>
  function $(id, props, extensions) {
    return $new(id, props, $, extensions);
  };
