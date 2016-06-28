var connFactory = require('./index');

module.exports = function (context, protocol) {
  return function (req, res) {
    var host = req.headers.host ? req.headers.host : '';
    var port = host.split(':')[1] || protocol.globalAgent.defaultPort;
    var hostname = port ? host : host + ':' + protocol.globalAgent.defaultPort;
    var app = context.hosts[hostname] || context.hosts[hostname + ':' + port] || context.hosts['0.0.0.0:' + port];

    function fail(e, conn) {
      e.pipeline = e.pipeline || ['host'];
      e.data = e.data || [];

      var _msg = (e.name || 'Error') + '(' + e.pipeline[0] + '): '
        + (e.statusMessage || e.message || e.toString());

      var _stack = (e.stack || '').replace(/.*Error:.+?\n/, '');

      if (_stack) {
        e.data.unshift({
          stackInfo: _stack.split('\n')
        });
      }

      // TODO: send to logger...
      console.log(e);

      if (conn.res.finished) {
        console.log(':(');
        return;
      }

      conn
        .set('content-type', 'text/plain')
        .status(e.statusCode || 500, e.statusMessage || conn.res.statusMessage);

      if (conn.type === 'application/json' && conn.env === 'development') {
        e.data.push({
          errorInfo: {
            pipeline: e.pipeline || ['host'],
            statusCode: res.statusCode,
            statusMessage: res.statusMessage,
            errorName: e.name,
            errorMessage: e.message || e.toString()
          }
        });

        conn.send(e.data);
      } else {
        if (_stack) {
          _msg += '\n' + _stack;
        }

        if (e.text && e.text.length) {
          e.text.forEach(function (info) {
            _msg += '\n\n' + info;
          });
        }

        // TODO: error page?
        conn.send(conn.env === 'development' ? _msg : conn.body);
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
          fail(e, conn);
        }
      });
    }
  };
};
