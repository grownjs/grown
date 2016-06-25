module.exports = function (context, container) {
  context.use = function () {
    Array.prototype.slice.call(arguments).forEach(function (cb) {
      cb(context, container.options);
    });

    return context;
  };
};
