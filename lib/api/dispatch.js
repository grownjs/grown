const pipelineFactory = require('../pipeline');

module.exports = (context, container) => {
  context.dispatch = pipelineFactory('dispatch', container.pipeline, (err, conn) => {
    /* istanbul ignore else */
    if (!conn.res.finished || !err) {
      if (conn.body === null && conn.res.statusCode === 200) {
        const errObj = err || new Error('Not Implemented');

        errObj.statusMessage = errObj.statusMessage || errObj.message;
        errObj.statusCode = errObj.statusCode || 501;

        throw errObj;
      } else {
        conn.send(conn.body);
      }
    }
  });
};
