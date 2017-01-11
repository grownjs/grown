'use strict';

const util = require('../util');

module.exports = ($) => {
  $.ctx.use = (cb) => {
    cb($, util);
  };
};
