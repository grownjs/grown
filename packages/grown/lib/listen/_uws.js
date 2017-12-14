'use strict';

const STATUS_CODES = require('http').STATUS_CODES;

const Transform = require('stream').Transform;

const $new = require('object-new');

const util = require('../util');
const _util = require('util');

let uws;

function ServerRequest(req) {
  Transform.call(this);

  this._writableState.objectMode = true;
  this._readableState.objectMode = false;

  this.url = req.url || '/';
  this.method = req.method || 'GET';
  this.headers = util.extendValues({}, req.headers);
  this.rawHeaders = [];

  Object.keys(req.headers).forEach(key => {
    this.rawHeaders.push(key);
    this.rawHeaders.push(req.headers[key]);
  });
}

_util.inherits(ServerRequest, Transform);

function ServerResponse(resp) {
  Transform.call(this);

  this.finished = false;
  this.statusCode = 200;
  this.statusMessage = STATUS_CODES[this.statusCode];

  $new.hiddenProperty(this, '_buffer', []);
  $new.hiddenProperty(this, '_headers', {});
  $new.hiddenProperty(this, '_response', resp);

  this.on('finish', () => {
    resp.finished = true;
    resp.statusCode = this.statusCode;
    resp.end(Buffer.concat(this._buffer));
  });
}

_util.inherits(ServerResponse, Transform);

ServerResponse.prototype._transform = function _transform(chunk, encoding, next) {
  this._buffer.push(chunk);
  next();
};

ServerResponse.prototype.writeHead = function writeHead(statusCode, reason, headers) {
  /* istanbul ignore else */
  if (this.finished) {
    throw new Error('Response is already sent');
  }

  /* istanbul ignore else */
  if (reason && typeof reason === 'object') {
    headers = reason;
    reason = undefined;
  }

  this.statusCode = statusCode;
  this.statusMessage = reason || STATUS_CODES[statusCode] || 'unknown';

  /* istanbul ignore else */
  if (headers) {
    Object.keys(headers).forEach(key => {
      this._response.setHeader(key, headers[key]);
    });
  }
};

ServerResponse.prototype.setHeader = function setHeader(name, value) {
  this._response.setHeader(name, value);
};

ServerResponse.prototype.getHeader = function getHeader(name) {
  return this._response.getHeader(name);
};

ServerResponse.prototype.removeHeader = function removeHeader(name) {
  this._response.removeHeader(name);
};

ServerResponse.prototype.end = function end() {
  Transform.prototype.end.apply(this, arguments);
  this.finished = true;
};

module.exports = {
  globalAgent: {
    defaultPort: process.env.PORT || 8080,
  },
  createServer(_options, _client) {
    /* istanbul ignore else */
    if (typeof _options === 'function') {
      _client = _options;
      _options = null;
    }

    uws = uws || require('uws');

    return uws.http.createServer((req, res) => {
      try {
        req.headers = req.headers || {};
        req.headers.host = req.headers.host || '0.0.0.0';

        _client(new ServerRequest(req), new ServerResponse(res));
      } catch (e) {
        console.log(e.stack);
      }
    });
  },
};
