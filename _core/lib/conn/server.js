var hostFactory = require('./host');

module.exports = function (app, context, options, callback) {
  var protocolName = app.location.protocol.substr(0, app.location.protocol.length - 1);
  var host = hostFactory(context, context.protocols[protocolName]);
  var server;

  if (protocolName === 'https') {
    server = context.protocols[protocolName].createServer(options, host);
  }

  if (protocolName === 'http') {
    server = context.protocols[protocolName].createServer(host);
  }

  if (!server) {
    throw new Error('Unsupported `' + protocolName + '` protocol');
  }

  return server.listen(app.port, '0.0.0.0', callback);
};
