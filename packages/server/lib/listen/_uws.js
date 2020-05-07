'use strict';

const STATUS_CODES = require('http').STATUS_CODES;

const { Transform, Readable } = require('stream');

const _util = require('util');

function readBody(req, res, cb) {
  const stream = new Readable();

  stream._read = () => true;
  stream._abort = () => {
    stream.destroy();
    cb();
  };

  req.pipe = stream.pipe.bind(stream);
  req.stream = stream;

  let buffer;
  res.onData((part, end) => {
    const chunk = Buffer.from(part);
    const slice = part.slice(part.byteOffset, part.byteLength);

    stream.push(new Uint8Array(slice));

    if (end) {
      stream.push(null);

      if (buffer) {
        cb(Buffer.concat([buffer, chunk]).toString('utf8'));
      } else {
        cb(chunk.toString('utf8'));
      }
    } else if (buffer) {
      buffer = Buffer.concat([buffer, chunk]);
    } else {
      buffer = Buffer.concat([chunk]);
    }
  });
}

function ServerRequest(req) {
  Transform.call(this);

  this._writableState.objectMode = true;
  this._readableState.objectMode = false;

  this.body = {};
  this.url = req.url || '/';
  this.method = req.method || 'GET';
  this.headers = _util._extend({}, req.headers);
  this.rawHeaders = [];

  Object.keys(req.headers).forEach(key => {
    this.rawHeaders.push(key);
    this.rawHeaders.push(req.headers[key]);
  });
}

_util.inherits(ServerRequest, Transform);

function ServerResponse(resp) {
  Transform.call(this);

  this._buffer = [];
  this._headers = {};
  this._pending = false;
  this._response = resp;

  this.aborted = false;
  this.finished = false;
  this.statusCode = 501;
  this.statusMessage = STATUS_CODES[this.statusCode];

  resp.onAborted(() => {
    if (this.stream) {
      this.stream._abort();
    }

    this.aborted = true;
    this.finished = true;
  });

  this.on('finish', () => {
    const body = Buffer.concat(this._buffer);

    this._headers['content-length'] = body.length.toString();

    const head = {};

    Object.keys(this._headers).forEach(key => {
      head[key.replace(/\b([a-z])/g, $0 => $0.toUpperCase())] = this._headers[key];
    });

    resp.writeStatus(`${this.statusCode} ${STATUS_CODES[this.statusCode]}`);
    this.writeHead(this.statusCode, head);
    this.finished = true;

    resp.write(body);
    resp.end();
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
      this.setHeader(key, headers[key]);
    });
  }
};

ServerResponse.prototype.setHeader = function setHeader(name, value) {
  this._headers[name.toLowerCase()] = value;
};

ServerResponse.prototype.getHeader = function getHeader(name) {
  return this._headers[name.toLowerCase()];
};

ServerResponse.prototype.removeHeader = function removeHeader(name) {
  delete this._headers[name.toLowerCase()];
};

ServerResponse.prototype.end = function end(code = 200) {
  /* istanbul ignore else */
  if (code > 0) {
    this.statusCode = code;
  }

  Transform.prototype.end.call(this);
};

module.exports = {
  readBody,
  ServerRequest,
  ServerResponse,
};
