'use strict';

const debug = require('debug')('grown:http');
const qs = require('querystring');
const WebSocket = require('ws');

const $host = require('./host');
const {
  send, sendFile, sendJSON, setStatus, setHeaders,
} = require('./util');

module.exports = function _http(ctx, options, callback, protocolName) {
  const cb = (req, res) => {
    req.query = req.query || qs.parse(req.url.split('?')[1]);
    res.send = send.bind(res);
    res.json = sendJSON.bind(res);
    res.status = setStatus.bind(res);
    res.sendFile = sendFile.bind(res);
    res._implicitHeader = res._implicitHeader || setHeaders.bind(res);

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

    const wss = new WebSocket.Server({ clientTracking: false, noServer: true });

    _protocol.on('upgrade', (request, socket, head) => {
      wss.handleUpgrade(request, socket, head, ws => {
        ws.on('close', () => {
          this._events.emit('close', ws);
          this._clients.splice(this._clients.indexOf(ws), 1);
        });
        this._clients.push(ws);
        this._events.emit('open', ws);
      });
    });

    callback.call(this);
  });

  return _protocol;
};
