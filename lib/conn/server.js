const hostFactory = require('./host');

module.exports = function (app, context, options, callback) {
  const protocolName = app.location.protocol.substr(0, app.location.protocol.length - 1);
  const host = hostFactory(context, context.protocols[protocolName]);

  let _server;

  if (protocolName === 'https') {
    _server = context.protocols[protocolName].createServer(options, host);
  } else {
    _server = context.protocols[protocolName].createServer(host);
  }

  /* istanbul ignore else */
  if (!_server) {
    throw new Error(`Unsupported '${protocolName}' protocol`);
  }

  return _server.listen(app.port, '0.0.0.0', function () {
    setTimeout((_self) => {
      callback.call(_self);
    }, 0, this);
  });
};
