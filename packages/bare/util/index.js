'use strict';

const util = require('util');

const $new = require('object-new');

const objectUtil = require('./object');
const processUtil = require('./process');

// merge all helpers
util._extend(module.exports, objectUtil);
util._extend(module.exports, processUtil);

// merge definition helpers
Object.keys($new).forEach(key => {
  module.exports[key] = $new[key];
});

// common utils
module.exports.inspect = util.inspect;
