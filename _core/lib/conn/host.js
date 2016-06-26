var connFactory = require('./index');

module.exports = function (context, protocol) {
  return function (req, res) {
    var host = req.headers.host ? req.headers.host : '';
    var port = host.split(':')[1] || protocol.globalAgent.defaultPort;
    var hostname = port ? host : host + ':' + protocol.globalAgent.defaultPort;
    var app = context.hosts[hostname] || context.hosts[hostname + ':' + port] || context.hosts['0.0.0.0:' + port];

    function fail(errorObj) {
      res.statusMessage = 'Error(host): ' + errorObj;
      res.statusCode = errorObj.statusCode || 500;
      res.end(res.statusMessage);
    }

    if (app) {
      connFactory(app, req, res, function (conn) {
        try {
          context.dispatch(conn);
        } catch (e) {
          // internal server error
          fail(e);
        }
      });
    } else {
      // not implemented
      res.statusMessage = 'Error(host): Host not found';
      res.statusCode = 501;
      res.end(res.statusMessage);
    }
  };
};
