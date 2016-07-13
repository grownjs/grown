var connFactory = require('./index');

module.exports = function (context, protocol) {
  return function (req, res, next) {
    var host = req.headers.host ? req.headers.host : '';
    var port = host.split(':')[1] || protocol.globalAgent.defaultPort;
    var hostname = port ? host : host + ':' + protocol.globalAgent.defaultPort;
    var app = context.hosts[hostname] || context.hosts[hostname + ':' + port] || context.hosts['0.0.0.0:' + port];

    function fail(e, conn) {
      e.pipeline = e.pipeline || ['host'];

      var _msg = (e.name || 'Error') + '(' + e.pipeline[0] + '): '
        + (e.statusMessage || e.message || e.toString());

      var _stack = (e.stack || '').replace(/.*Error:.+?\n/, '');

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
        _msg += '\n' + _stack;
      }

      // TODO: error page?
      conn.res.end(_msg);
    }

    /* istanbul ignore else */
    if (app) {
      var conn = connFactory(app, req, res);

      context
        .dispatch(conn, app.container.options)
        .catch(function (err) {
          fail(err, conn);
        })
        .then(function () {
          next();
        });
    }
  };
};
