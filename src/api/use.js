const util = require('../util');

module.exports = ($) => {
  $.ctx.use = (cb) => {
    const task = cb($, util);

    /* istanbul ignore else */
    if (task) {
      $.initializers.push(task);
    }
  };
};
