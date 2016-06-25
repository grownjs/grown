var pipelineFactory = require('../pipeline');

module.exports = function (context, container) {
  context.dispatch = pipelineFactory('dispatch', container.pipeline, container.options);
};
