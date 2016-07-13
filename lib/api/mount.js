var buildFactory = require('../factory');

module.exports = function (context, container) {
  context.mount = function (callback) {
    container.pipeline.push(buildFactory(callback, container.options, 'mount'));

    return context;
  };
};
