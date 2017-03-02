const uws = require('../../external/uWebSockets/nodejs/dist/uws');

const STATUS_CODES = require('http').STATUS_CODES;

const Transform = require('stream').Transform;

const util = require('../util');
const _util = require('util');

function Readable(req) {
  Transform.call(this);

  this._writableState.objectMode = true;
  this._readableState.objectMode = false;

  this.url = req.url;
  this.method = req.method;
  this.headers = util.extend({}, req.headers);
  this.rawHeaders = [];

  Object.keys(req.headers).forEach((key) => {
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

Writable.prototype._transform = function (chunk, encoding, next) {
  this.push(chunk);
  next();
};

Writable.prototype._write = function (chunk, encoding, callback) {
  /* istanbul ignore else */
  if (!this.finished) {
    this.writeHead(this.statusCode);
    this.finished = true;
  }

  this._resp.write(chunk, encoding);
  callback();
};

Writable.prototype.setHeader = function (name, value) {
  this._headers[name.toLowerCase()] = value;
};

Writable.prototype.getHeader = function (name) {
  return this._headers[name.toLowerCase()];
};

Writable.prototype.removeHeader = function (name) {
  delete this._headers[name.toLowerCase()];
};

Writable.prototype.writeHead = function (statusCode, reason, headers) {
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
    Object.keys(headers).forEach((key) => {
      this._headers[key] = headers[key];
    });
  }

  Object.keys(this._headers).forEach((key) => {
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

      // FIXME: this eventually will be implemented on uws
      return uws.http.createServer((req, res) => {
        try {
          _client(new Readable(req),
                  new Writable(res));
        } catch (e) {
          console.log(e.stack);
        }
      });
    },
  },
};
