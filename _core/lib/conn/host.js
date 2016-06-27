var connFactory = require('./index');

module.exports = function (context, protocol) {
  return function (req, res) {
    var host = req.headers.host ? req.headers.host : '';
    var port = host.split(':')[1] || protocol.globalAgent.defaultPort;
    var hostname = port ? host : host + ':' + protocol.globalAgent.defaultPort;
    var app = context.hosts[hostname] || context.hosts[hostname + ':' + port] || context.hosts['0.0.0.0:' + port];

    function fail(e) {
      res.statusMessage = e.statusMessage || res.statusMessage;
      res.statusCode = e.statusCode || 500;
      res.setHeader('Content-Type', 'text/plain');

      var _msg = (e.name || 'Error') + '(' + (e.pipeline || ['host']).join('.') + '): '
        + (e.statusMessage || e.message || e.toString());

      if (e.stack) {
        _msg += '\n' + e.stack.replace(/.*Error:.+?\n/, '');
      }

      if (e.data) {
        _msg += '\n---\n' + JSON.stringify(e.data, null, 2) + '\n---';
      }

      res.end(_msg);
    }

    if (app) {
      connFactory(app, req, res, function (conn) {
        try {
          context
            .dispatch(conn, app.container.options)
            .catch(fail);
        } catch (e) {
          // internal server error
          if (!conn.res.finished) {
            fail(e);
          }
        }
      });
    }
  };
};
