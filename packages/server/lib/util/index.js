'use strict';

const _util = require('util');

module.exports = baseUtils => {
  _util._extend(baseUtils, require('./context'));

  return baseUtils;
};
