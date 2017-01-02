export default ($) => {
  $.ctx.use = (cb) => {
    const task = cb($);

    if (task) {
      $.initializers.push(task);
    }
  };
};
