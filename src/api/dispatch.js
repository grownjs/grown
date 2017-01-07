const pipelineFactory = require('../pipeline');

// final handler
function _dispatch(err, conn) {
  /* istanbul ignore else */
  if (!conn.halted) {
    /* istanbul ignore else */
    if (err) {
      throw err;
    }

    return conn.end();
  }
}

module.exports = ($) => {
  $.ctx.dispatch = pipelineFactory('_dispatch', $.pipeline, _dispatch);
};
