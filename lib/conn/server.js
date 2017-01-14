'use strict';

const hostFactory = require('./host');

module.exports = function _server(server, options, callback) {
  const protocolName = server.location.protocol.replace(':', '');
  const cb = hostFactory.bind(this, this._protocols[protocolName]);

  let _protocol;

  if (protocolName === 'https') {
    _protocol = this._protocols[protocolName].createServer(options, cb);
  } else {
    _protocol = this._protocols[protocolName].createServer(cb);
  }

  /* istanbul ignore else */
  if (!_protocol) {
    throw new Error(`Unsupported '${protocolName}' protocol`);
  }

  return _protocol.listen(server.port, '0.0.0.0', function _onListen() {
    setTimeout((_self) => {
      callback.call(_self);
    }, 0, this);
  });
};
