'use strict';

const hostFactory = require('./host');

module.exports = (server, options, container, callback) => {
  const protocolName = server.location.protocol.replace(':', '');
  const host = hostFactory(container, container.context.protocols[protocolName]);

  let _server;

  if (protocolName === 'https') {
    _server = container.context.protocols[protocolName].createServer(options, host);
  } else {
    _server = container.context.protocols[protocolName].createServer(host);
  }

  /* istanbul ignore else */
  if (!_server) {
    throw new Error(`Unsupported '${protocolName}' protocol`);
  }

  return _server.listen(server.port, '0.0.0.0', function _onListen() {
    setTimeout((_self) => {
      callback.call(_self);
    }, 0, this);
  });
};
