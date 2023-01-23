'use strict';

const debug = require('debug')('grown:http');
const WebSocket = require('ws');

const $host = require('./host');
const {
  send, sendFile, sendJSON, setStatus, setHeaders,
} = require('./util');

module.exports = function _http(ctx, options, callback, protocolName) {
  const parseConfig = this._options('parse', null);
  const urlencoded = require('body-parser').urlencoded({ extended: true });
  const json = require('body-parser').json({ limit: this._options('json', '5MB') });
  const raw = require('body-parser').raw({ inflate: true, type: () => true });

  const bodyFailure = (err, kind) => {
    if (err) {
      err.message = `Error decoding input (${kind})\n${err.message}`;
      this._events.emit('failure', err, this._options);
    }
    return err;
  };

  const cb = (req, res) => {
    req.query = req.query || Object.fromEntries(new URLSearchParams(req.url.split('?')[1]));

    Object.defineProperty(req, 'secure', {
      get: () => req.protocol === 'https',
    });

    res.send = send.bind(res);
    res.json = sendJSON.bind(res);
    res.status = setStatus.bind(res);
    res.sendFile = sendFile.bind(res);
    res._implicitHeader = res._implicitHeader || setHeaders.bind(res);

    const next = () => $host.call(this, ctx.location, req, res);

    if (!process.headless && !this._uploads && !req._body && !req.body) {
      let type = req.headers['content-type'] || '';
      if (parseConfig instanceof RegExp) type = parseConfig.test(req.url) ? type : '';
      if (typeof parseConfig === 'function') type = parseConfig(req) ? type : '';
      if (parseConfig === false) return next();

      if (type.includes('multipart')) {
        next(new Error('Missing Grown.Upload'));
      } else if (type.includes('json')) {
        json(req, res, err => next(bodyFailure(err, 'JSON')));
      } else if (type.includes('url')) {
        urlencoded(req, res, err => next(bodyFailure(err, 'URL')));
      } else {
        raw(req, res, err => next(bodyFailure(err, 'RAW')));
      }
    } else {
      next();
    }
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
