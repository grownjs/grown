import pipelineFactory from '../_pipeline';

// final handler
function _dispatch(err, conn) {
  /* istanbul ignore else */
  if (!conn.res.finished) {
    let statusCode = conn.status;
    let message = conn.resp_body;

    /* istanbul ignore else */
    if (err) {
      message = err.statusMessage || err.message;
      statusCode = err.statusCode || 501;
    }

    conn.resp(statusCode, message);
  }
}

export default ($) => {
  $.ctx.dispatch = pipelineFactory('_dispatch', $.pipeline, _dispatch);
};
