'use strict';

/* eslint-disable prefer-rest-params */
/* eslint-disable prefer-spread */

const _debug = require('debug');

// dynamic debugging
module.exports = (group) => {
  if (process.env.DEBUG) {
    return _debug(group);
  }

  return function () {
    const args = Array.prototype.slice.call(arguments);

    console.log.apply(console, [group].concat(args));
  };
};
