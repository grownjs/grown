import connFactory from './ctx';

export default ($, protocol) => {
  return (req, res, next) => {
    // normalize
    const host = req.headers.host ? req.headers.host : '';
    const port = host.split(':')[1] || protocol.globalAgent.defaultPort;
    const hostname = port ? host : `${host}:${protocol.globalAgent.defaultPort}`;

    // proxy next() callback
    function _next(e) {
      if (typeof next === 'function') {
        next(e);
      }

      if (!next && e) {
        throw e;
      }
    }

    // error handler
    function fail(e, conn) {
      e.pipeline = e.pipeline || ['host'];

      let _msg = e.message || e.toString();

      _msg = `${e.name || 'Error'}(${e.pipeline.join('.')}): ${_msg}`;

      const _stack = (e.stack || '').replace(/.*Error:.+?\n/, '');

      // TODO: send to logger for testing purposes...
      // console.log('ERR', e, conn);

      /* istanbul ignore else */
      if (conn.res.finished) {
        _next(e);
        return;
      }

      // istanbul ignore else
      if (_stack) {
        _msg += `\n${_stack}`;
      }

      conn.put_resp_header('content-type', 'text/plain');
      conn.resp(e.statusCode || 500, _msg);
    }

    // lookup opened connection
    const _server = $.hosts[hostname]
      || $.hosts[`${hostname}:${port}`]
      || $.hosts[`0.0.0.0:${port}`];

    /* istanbul ignore else */
    if (_server) {
      const conn = connFactory($, _server, req, res);

      try {
        $.ctx.dispatch(conn, $.opts)
          .catch(err => fail(err, conn))
          .then(() => _next());
      } catch (e) {
        fail(e, conn);
      }
    }
  };
};
