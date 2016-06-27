var connFactory = require('./index');

module.exports = function (context, protocol) {
  return function (req, res) {
    var host = req.headers.host ? req.headers.host : '';
    var port = host.split(':')[1] || protocol.globalAgent.defaultPort;
    var hostname = port ? host : host + ':' + protocol.globalAgent.defaultPort;
    var app = context.hosts[hostname] || context.hosts[hostname + ':' + port] || context.hosts['0.0.0.0:' + port];

    if (app) {
      connFactory(app, req, res, function (conn) {
        try {
          context.dispatch(conn, app.container.options);
        } catch (e) {
          // internal server error
          res.statusMessage = e.statusMessage || e.message || e.toString();
          res.statusCode = e.statusCode || 500;
          res.setHeader('Content-Type', 'text/plain');

          var _msg = 'Error(' + (e.label || 'host') + '): ' + res.statusMessage;

          if (e.stack) {
            _msg += '\n' + e.stack.replace(/Error:.+?\n/, '');
          }

          res.end(_msg);
        }
      });
    }
  };
};
