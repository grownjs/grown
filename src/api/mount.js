const buildFactory = require('../factory');

module.exports = ($) => {
  $.ctx.mount = (name, _cb) => {
    if (typeof name === 'function') {
      _cb = name;
      name = null;
    }

    const cb = buildFactory(_cb, $.otps, 'mount');

    if (name && (cb.name === '?' || cb.name === '*')) {
      cb.name = `${name}${cb.name}`;
    }

    $.pipeline.push(cb);
  };
};
