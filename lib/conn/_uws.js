/* eslint-disable import/no-unresolved */
let uws;

try {
  uws = require('../../external/uWebSockets/nodejs/dist/uws');
} catch (e) {
  // do nothing
}

const STATUS_CODES = require('http').STATUS_CODES;

const Transform = require('stream').Transform;

const util = require('../util');
const _util = require('util');

function Readable(req) {
  Transform.call(this);

  this._writableState.objectMode = true;
  this._readableState.objectMode = false;

  this.url = req.url || '/';
  this.method = req.method || 'GET';
  this.headers = util.extend({}, req.headers);
  this.rawHeaders = [];

  Object.keys(req.headers).forEach(key => {
    this.rawHeaders.push(key);
    this.rawHeaders.push(req.headers[key]);
  });
}

_util.inherits(Readable, Transform);

function Writable(res) {
  Transform.call(this);

  this._resp = res;
  this._headers = {};

  this.statusCode = 200;
  this.statusMessage = STATUS_CODES[this.statusCode];
}

_util.inherits(Writable, Transform);

Writable.prototype._transform = function _transform(chunk, encoding, next) {
  this.push(chunk);
  next();
};

Writable.prototype._write = function _write(chunk, encoding, callback) {
  /* istanbul ignore else */
  if (!this.finished) {
    this.writeHead(this.statusCode);
    this.finished = true;
  }

  this._resp.write(chunk, encoding);
  callback();
};

Writable.prototype.setHeader = function setHeader(name, value) {
  this._headers[name.toLowerCase()] = value;
};

Writable.prototype.getHeader = function getHeader(name) {
  return this._headers[name.toLowerCase()];
};

Writable.prototype.removeHeader = function removeHeader(name) {
  delete this._headers[name.toLowerCase()];
};

Writable.prototype.writeHead = function writeHead(statusCode, reason, headers) {
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

  this._resp.write(`HTTP/1.1 ${this.statusCode} ${this.statusMessage}\n`);

  /* istanbul ignore else */
  if (headers) {
    Object.keys(headers).forEach(key => {
      this._headers[key] = headers[key];
    });
  }

  Object.keys(this._headers).forEach(key => {
    this._resp.write(`${key}: ${this._headers[key]}\n`);
  });

  this._resp.write('\n');

  this.finished = true;
};

module.exports = {
  props: {
    globalAgent: {
      defaultPort: process.env.PORT || 8080,
    },
  },
  methods: {
    createServer(_options, _client) {
      /* istanbul ignore else */
      if (typeof _options === 'function') {
        _client = _options;
        _options = null;
      }

      if (!uws) {
        throw new Error('Not implemented yet!');
      }

      // FIXME: this eventually will be implemented on uws
      return uws.http.createServer((req, res) => {
        try {
          req.headers = req.headers || {};
          req.headers.host = req.headers.host || '0.0.0.0';

          _client(new Readable(req),
                  new Writable(res));
        } catch (e) {
          console.log(e.stack);
        }
      });
    },
  },
};
