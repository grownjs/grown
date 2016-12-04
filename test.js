'use strict';

const Readable = require('stream').Readable;
const Writable = require('stream').Writable;

module.exports = (server) => {
  let _fn;

  function makeRequest(next) {
    server.listen({ protocol: 'test' }).then((_server) => {
      const _opts = {
        end: false,
        body: null,
        buffer: [],
        headers: {},
      };

      const _req = new Readable();

      _req._read = () => {
        _opts.buffer.forEach((data) => {
          _req.push(data);
        });

        _req.push(null);
      };

      // known interface
      _req.url = '/';
      _req.query = '';
      _req.method = 'GET';
      _req.headers = {};
      _req.headers = { host: _server.location.host };

      // initial length
      _req.headers['content-length'] = 0;

      // test interface
      _req._pushData = (data) => {
        _opts.buffer.push(data);
        _req.headers['content-length'] += data.length;
      };

      next(_req, (end) => {
        _opts.end = end;

        /* istanbul ignore else */
        if (_fn) {
          const _res = new Writable();
          const _end = _res.end;

          // by-pass
          _res.end = (chunk) => {
            _res.finished = true;

            /* istanbul ignore else */
            if (chunk) {
              _opts.body = chunk;
            }

            _end.call(_res);

            return _res;
          };

          // known interface
          _res.finished = false;
          _res.statusCode = 200;
          _res.statusMessage = 'OK';

          _res.getHeader = (k) => _opts.headers[k];
          _res.setHeader = (k, v) => { _opts.headers[k] = v; };

          // test interface
          Object.defineProperty(_res, 'output', {
            get() {
              return _opts.body;
            },
            set() {
              throw new Error('Output is already defined');
            },
          });

          _fn(_req, _res, (e) => {
            /* istanbul ignore else */
            if (_opts.end && !_opts.end._finished) {
              _opts.end._finished = true;
              _opts.end(e, _res);
            }
          });
        }
      });
    });
  }

  makeRequest.protocol = () => {
    return {
      createServer(_options, _client) {
        if (typeof _options === 'function') {
          _client = _options;
          _options = null;
        }

        _fn = _client;

        return { listen(port, host, callback) { callback(); } };
      },
    };
  };

  makeRequest.fetch = (method, path, opts) => {
    return new Promise((resolve, reject) => {
      makeRequest((req, next) => {
        let _method = typeof method === 'string' && typeof path === 'string' ? method : 'get';
        let _path = typeof path === 'string' ? path : method || '/';
        let _opts = typeof path === 'object' ? path : opts || {};

        /* istanbul ignore else */
        if (typeof method === 'object') {
          _opts = method;
          _method = 'get';
          _path = '/';
        }

        req.url = _path;
        req.method = _method.toUpperCase();

        Object.keys(_opts).forEach((_key) => {
          req[_key] = _opts[_key];
        });

        next((e, res) => {
          if (e) {
            reject(e);
          } else {
            resolve(res);
          }
        });
      });
    });
  };

  return makeRequest;
};
