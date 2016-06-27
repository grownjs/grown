var connFactory = require('./index');

module.exports = function (context, protocol) {
  return function (req, res) {
    var host = req.headers.host ? req.headers.host : '';
    var port = host.split(':')[1] || protocol.globalAgent.defaultPort;
    var hostname = port ? host : host + ':' + protocol.globalAgent.defaultPort;
    var app = context.hosts[hostname] || context.hosts[hostname + ':' + port] || context.hosts['0.0.0.0:' + port];

    function fail(e, conn) {
      res.statusMessage = e.statusMessage || res.statusMessage;
      res.statusCode = e.statusCode || 500;
      res.setHeader('Content-Type', 'text/plain');

      var _msg = (e.name || 'Error') + '(' + (e.pipeline || ['host']).join('.') + '): '
        + (e.statusMessage || e.message || e.toString());

      var _stack = (e.stack || '').replace(/.*Error:.+?\n/, '');

      if (_stack) {
        e.data.unshift({
          stackInfo: _stack.split('\n')
        });
      }

      if (conn.header('content-type') === 'application/json' && conn.env === 'development') {
        e.data.push({
          errorInfo: {
            pipeline: e.pipeline || ['host'],
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            errorName: e.name,
            errorMessage: e.message || e.toString()
          }
        });

        conn.json(e.data);
      } else {
        if (_stack) {
          _msg += '\n' + _stack;
        }

        if (e.text && e.text.length) {
          e.text.forEach(function (info) {
            _msg += '\n\n' + info;
          });
        }

        conn.end(_msg);
      }
    }

    if (app) {
      connFactory(app, req, res, function (conn) {
        try {
          context
            .dispatch(conn, app.container.options)
            .catch(function (err) {
              fail(err, conn);
            });
        } catch (e) {
          // internal server error
          if (!conn.res.finished) {
            fail(e, conn);
          }
        }
      });
    }
  };
};
