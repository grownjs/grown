var connFactory = require('./index');

module.exports = function (context, protocol) {
  return function (req, res) {
    var host = req.headers.host ? req.headers.host : '';
    var port = host.split(':')[1] || protocol.globalAgent.defaultPort;
    var hostname = port ? host : host + ':' + protocol.globalAgent.defaultPort;
    var app = context.hosts[hostname] || context.hosts[hostname + ':' + port] || context.hosts['0.0.0.0:' + port];

    if (app) {
      try {
        context.dispatch(connFactory(app, req, res));
      } catch (e) {
        // internal server error
        res.statusCode = e.statusCode || 500;
        res.end('Error(host): ' + e);
      }
    } else {
      // not implemented
      res.statusCode = 501;
      res.end('Error(host): Host not found');
    }
  };
};
