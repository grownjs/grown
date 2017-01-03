var Readable = require('stream').Readable;
var Writable = require('stream').Writable;

var test = function (server) {
  var _fn;

  function makeRequest(next) {
    server.ctx.listen({ protocol: 'test' }).then(function (_server) {
      var _opts = {
        end: false,
        body: null,
        buffer: [],
        headers: {},
      };

      var _req = new Readable();

      _req._read = function () {
        _opts.buffer.forEach(function (data) {
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
      _req._pushData = function (data) {
        _opts.buffer.push(data);
        _req.headers['content-length'] += data.length;
      };

      next(_req, function (end) {
        _opts.end = end;

        /* istanbul ignore else */
        if (_fn) {
          var _res = new Writable();
          var _end = _res.end;

          // by-pass
          _res.end = function (chunk) {
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
          _res.statusCode = 501;
          _res.statusMessage = 'Not Implemented';

          _res.getHeader = function (k) { return _opts.headers[k]; };
          _res.setHeader = function (k, v) { _opts.headers[k] = v; };

          // test interface
          Object.defineProperty(_res, 'body', {
            get: function get() {
              return _opts.body;
            },
            set: function set() {
              throw new Error('Output body is already defined');
            },
          });

          _fn(_req, _res, function (e) {
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

  makeRequest.protocol = function () {
    return {
      createServer: function createServer(_options, _client) {
        if (typeof _options === 'function') {
          _client = _options;
          _options = null;
        }

        _fn = _client;

        return { listen: function listen(port, host, callback) { callback(); } };
      },
    };
  };

  makeRequest.fetch = function (method, path, opts) {
    return new Promise(function (resolve) {
      makeRequest(function (req, next) {
        var _method = typeof method === 'string' && typeof path === 'string' ? method : 'get';
        var _path = typeof path === 'string' ? path : method || '/';
        var _opts = typeof path === 'object' ? path : opts || {};

        /* istanbul ignore else */
        if (typeof method === 'object') {
          _opts = method;
          _method = 'get';
          _path = '/';
        }

        req.url = _path;
        req.method = _method.toUpperCase();

        Object.keys(_opts).forEach(function (_key) {
          req[_key] = _opts[_key];
        });

        next(function (e, res) {
          Object.defineProperty(res, 'error', {
            get: function get() {
              return e;
            },
            set: function set() {
              throw new Error('Error cannot be set');
            },
          });

          resolve(res);
        });
      });
    });
  };

  return makeRequest;
};

module.exports = test;
