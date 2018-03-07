'use strict';

const _util = require('util');

module.exports = baseUtils => {
  const util = baseUtils.extendValues({}, baseUtils);

  _util._extend(util, require('./context'));

  return util;
};
