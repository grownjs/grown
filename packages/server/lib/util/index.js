'use strict';

module.exports = baseUtils => {
  Object.assign(baseUtils, require('./context'));

  return baseUtils;
};
