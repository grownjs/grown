const buildFactory = require('../factory');

module.exports = ($) => {
  $.ctx.mount = (callback) => {
    $.pipeline.push(buildFactory(callback, $.otps, 'mount'));
  };
};
