const connFactory = require('./index');

module.exports = (context, protocol) => {
  return (req, res, next) => {
    const host = req.headers.host ? req.headers.host : '';
    const port = host.split(':')[1] || protocol.globalAgent.defaultPort;
    const hostname = port ? host : `${host}:${protocol.globalAgent.defaultPort}`;
    const app = context.hosts[hostname] || context.hosts[`${hostname}:${port}`] || context.hosts[`0.0.0.0:${port}`];

    function fail(e, conn) {
      e.pipeline = e.pipeline || ['host'];

      let _msg = `${e.name || 'Error'}(${e.pipeline[0]}): '${e.statusMessage || e.message || e.toString()}`;

      const _stack = (e.stack || '').replace(/.*Error:.+?\n/, '');

      // TODO: send to logger for testing purposes...
      // console.log(e.stack);

      /* istanbul ignore else */
      if (conn.res.finished) {
        return next(e);
      }

      conn.res.setHeader('Content-Type', 'text/plain');
      conn.res.statusCode = e.statusCode || 500;
      conn.res.statusMessage = e.statusMessage || conn.res.statusMessage;

      /* istanbul ignore else */
      if (_stack) {
        _msg += `\n${_stack}`;
      }

      // TODO: error page?
      conn.res.end(_msg);
    }

    /* istanbul ignore else */
    if (app) {
      const conn = connFactory(app, req, res);

      context
        .dispatch(conn, app.container.options)
        .catch((err) => fail(err, conn))
        .then(() => next());
    }
  };
};
