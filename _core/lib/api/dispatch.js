var pipelineFactory = require('../pipeline');

module.exports = function (context, container) {
  context.dispatch = pipelineFactory('dispatch', container.pipeline, function (err, conn) {
    if (!conn.res.finished && !err) {
      var errObj = new Error('Not Implemented');
      errObj.statusMessage = errObj.message;
      errObj.statusCode = 501;
      throw errObj;
    }

    console.log('END BRO!');
  });
};
