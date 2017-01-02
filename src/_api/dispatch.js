import pipelineFactory from '../_pipeline';

// final handler
function _dispatch(err, conn) {
  /* istanbul ignore else */
  if (conn.res._hasBody && conn.res._headerSent) {
    conn.res.end();
    return;
  }

  /* istanbul ignore else */
  const errObj = err || new Error('Not Implemented');

  errObj.statusMessage = errObj.statusMessage || errObj.message;
  errObj.statusCode = errObj.statusCode || 501;

  throw errObj;
}

export default ($) => {
  $.ctx.dispatch = pipelineFactory('_dispatch', $.pipeline, _dispatch);
};
