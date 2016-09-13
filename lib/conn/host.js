'use strict';

const connFactory = require('./index');

module.exports = (container, protocol) => {
  return (req, res, next) => {
    const host = req.headers.host ? req.headers.host : '';
    const port = host.split(':')[1] || protocol.globalAgent.defaultPort;
    const hostname = port ? host : `${host}:${protocol.globalAgent.defaultPort}`;

    const _context = container.context.hosts[hostname]
      || container.context.hosts[`${hostname}:${port}`]
      || container.context.hosts[`0.0.0.0:${port}`];

    function fail(e, conn) {
      e.pipeline = e.pipeline || ['host'];

      let _msg = e.message || e.toString();

      _msg = `${e.name || 'Error'}(${e.pipeline[0]}): ${_msg}`;

      const _stack = (e.stack || '').replace(/.*Error:.+?\n/, '');

      // TODO: send to logger for testing purposes...
      // console.log(e.stack);

      /* istanbul ignore else */
      if (conn.res.finished) {
        next(e);
        return;
      }

      conn.set('content-type', 'text/plain');
      conn.status(e.statusCode || 500);

      /* istanbul ignore else */
      if (_stack) {
        _msg += `\n${_stack}`;
      }

      // TODO: error page?
      conn.res.end(_msg);
    }

    /* istanbul ignore else */
    if (_context) {
      const conn = connFactory(_context, req, res);

      container._dispatch(conn, container.options)
        .catch((err) => fail(err, conn))
        .then(() => next());
    }
  };
};
