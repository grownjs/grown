'use strict';

const fastEquals = require('fast-equals').default;

const processUtil = require('./process');
const objectUtil = require('./object');
const stringUtil = require('./string');
const ctxUtil = require('./ctx');

// categorized helpers
module.exports = objectUtil.extend({
  eq: fastEquals,
  ctx: ctxUtil,
}, objectUtil, stringUtil, processUtil);
