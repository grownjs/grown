module.exports = ($) => {
  $.ctx.use = (cb) => {
    const task = cb($);

    /* istanbul ignore else */
    if (task) {
      $.initializers.push(task);
    }
  };
};
