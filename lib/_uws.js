const uws = require('../external/uWebSockets/nodejs/dist/uws');

const Writable = require('stream').Writable;

const util = require('./util');

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
          const _headers = {};

          const _req = {
            url: req.url,
            method: req.method,
            headers: util.extend({}, req.headers),
            rawHeaders: [],
          };

          Object.keys(_req.headers).forEach((key) => {
            _req.rawHeaders.push(key);
            _req.rawHeaders.push(_req.headers[key]);
          });

          const _res = new Writable();

          _res.finished = false;
          _res.statusCode = 200;
          _res.statusMessage = 'OK';

          _res.getHeader = (key) => {
            return _headers[key];
          };

          _res.setHeader = (key, value) => {
            _headers[key] = value;
          };

          _res.writeHead = (status, headers) => {
            /* istanbul ignore else */
            if (_res.finished) {
              throw new Error('Response is already sent');
            }

            res.write(`HTTP/1.1 ${status} ${_res.statusMessage}\n`);

            /* istanbul ignore else */
            if (headers) {
              Object.keys(headers).forEach((key) => {
                _headers[key] = headers[key];
              });
            }

            Object.keys(_headers).forEach((key) => {
              res.write(`${key}: ${_headers[key]}\n`);
            });

            res.write('\n');

            _res.finished = true;
          };

          _res._write = (chunk, encoding, callback) => {
            /* istanbul ignore else */
            if (!_res.finished) {
              _res.writeHead(_res.statusCode);
              _res.finished = true;
            }

            res.write(chunk, encoding);
            callback();
          };

          _client(_req, _res);
        } catch (e) {
          console.log(e.stack);
        }
      });
    },
  },
};
