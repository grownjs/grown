'use strict';

const debug = require('debug')('grown:http');

const $host = require('./host');

module.exports = function _http(ctx, options, callback, protocolName) {
  const cb = $host.bind(this, ctx.location);

  let _protocol;
  if (protocolName === 'https') {
    _protocol = require(protocolName).createServer(options, cb);
  } else {
    _protocol = require(protocolName).createServer(cb);
  }

  const { host, port } = ctx;

  this.close = () => _protocol.close();

  _protocol.listen(port, host, () => {
    debug('#%s Server was started and listening at port', process.pid, port);

    callback.call(this);
  });
};
