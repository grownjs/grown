'use strict';

const debug = require('debug')('grown:http');
const qs = require('querystring');

const $host = require('./host');
const { send, sendFile, setStatus } = require('./util');

module.exports = function _http(ctx, options, callback, protocolName) {
  const cb = (req, res) => {
    req.query = req.query || qs.parse(req.url.split('?')[1]);
    res.send = send.bind(res);
    res.status = setStatus.bind(res);
    res.sendFile = sendFile.bind(res);

    $host.call(this, ctx.location, req, res);
  };

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
