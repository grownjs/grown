'use strict';

const buildFactory = require('../factory');

module.exports = ($) => {
  $.ctx.mount = (name, _cb) => {
    /* istanbul ignore else */
    if (typeof name !== 'string') {
      _cb = name;
      name = null;
    }

    const cb = buildFactory(_cb, $.otps, 'mount');

    /* istanbul ignore else */
    if (name && (cb.name === '?' || cb.name === '*')) {
      cb.name = `${name}${cb.name}`;
    }

    $.pipeline.push(cb);
  };
};
