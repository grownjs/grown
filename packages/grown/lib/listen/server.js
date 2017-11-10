'use strict';

const debug = require('debug')('grown:listen');

const $host = require('./host');

module.exports = function $server(ctx, options, callback) {
  debug('Initializing ctx for %s', ctx.location.protocol);

  const protocolName = ctx.location.protocol.replace(':', '');
  const cb = $host.bind(this, this._protocols[protocolName]);

  let _protocol;

  try {
    if (protocolName === 'https') {
      _protocol = this._protocols[protocolName].createServer(options, cb);
    } else {
      _protocol = this._protocols[protocolName].createServer(cb);
    }
  } catch (e) {
    throw new Error(`Protocol '${protocolName}' failed. ${e.message}`);
  }

  /* istanbul ignore else */
  if (!_protocol) {
    throw new Error(`Unsupported '${protocolName}' protocol`);
  }

  _protocol.listen(ctx.port, '0.0.0.0', function _onListen() {
    debug('Server was started and listening at port', ctx.port);

    callback.call(this);
  });

  return _protocol;
};
