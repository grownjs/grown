'use strict';

const debug = require('debug')('homegrown:server');

const hostFactory = require('./host');

module.exports = function $server(server, options, callback) {
  debug('Creating server for %s', server.location.protocol);

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
      debug('Server was started and listening at port', server.port);

      callback.call(_self);
    }, 0, this);
  });
};
