var pipelineFactory = require('../pipeline');

module.exports = function (context, container) {
  context.dispatch = pipelineFactory('dispatch', container.pipeline, function (err, conn) {
    if (!conn.res.finished && !err) {
      if (typeof conn._body !== 'undefined' && conn._body !== null) {
        var _body = conn._body;

        conn.res.statusCode = conn.res.statusCode || 200;
        conn.res.end(_body);
        return;
      }

      var errObj = new Error('Not Implemented');
      errObj.statusMessage = errObj.message;
      errObj.statusCode = 501;
      throw errObj;
    }
  });
};
