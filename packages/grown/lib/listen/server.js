'use strict';

const debug = require('debug')('grown:listen');

const $host = require('./host');

module.exports = function $server(ctx, options, callback) {
  debug('#%s Initializing <%s> protocol', process.pid, ctx.location.protocol);

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
    throw new Error(`Protocol '${protocolName}' failed. ${e.stack}`);
  }

  /* istanbul ignore else */
  if (!_protocol) {
    throw new Error(`Unsupported '${protocolName}' protocol`);
  }

  _protocol.listen(ctx.port, '0.0.0.0', function _onListen() {
    debug('#%s Server was started and listening at port', process.pid, ctx.port);

    callback.call(this);
  });

  return _protocol;
};
